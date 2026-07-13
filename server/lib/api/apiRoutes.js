import logger from '../logger.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import loginController from './loginController.js';
import sessionController from './sessionController.js';
import userController from './userController.js';
import { buildPasswordResetUrl, sendPasswordResetMail } from './passwordResetMailer.js';
import {
  asyncHandler,
  createApiError,
  ensureRequestId,
  sendError,
  sendOk
} from './apiResponse.js';

function toPositiveInt (value, fallback) {
  const number = Number(value);

  if (Number.isInteger(number) && number > 0) {
    return number;
  }

  return fallback;
}

function createLimiter (config, sectionName, defaults) {
  const section = config?.security?.rateLimit?.[sectionName] || {};
  const windowMs = toPositiveInt(section.windowMs, defaults.windowMs);
  const max = toPositiveInt(section.max, defaults.max);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler (req, res) {
      return sendError(req, res, 429, 'RATE_TOO_MANY_REQUESTS', defaults.message);
    }
  });
}

const apiRoutes = {
  init (app, config) {
    sessionController.init(config);

    app.use('/api', (req, _res, next) => {
      ensureRequestId(req);

      return next();
    });

    const loginLimiter = createLimiter(config, 'login', {
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Zu viele Login-Versuche. Bitte spaeter erneut versuchen.'
    });
    const passwordResetLimiter = createLimiter(config, 'passwordReset', {
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Zu viele Passwort-Reset-Anfragen. Bitte spaeter erneut versuchen.'
    });

    app.post('/api/login', loginLimiter, asyncHandler(async (req, res) => {
      const { username, password } = req.body;
      const user = await loginController.loginUser(username, password);

      if (user) {
        const token = sessionController.addSession(user);

        res.cookie('session_token', token, {
          httpOnly: true,
          secure: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
          sameSite: 'strict'
        });

        sendOk(req, res, { user });
      } else {
        logger.error('Ungueltiger Benutzername oder Passwort', username);
        throw createApiError(401, 'AUTH_INVALID_CREDENTIALS', 'Ungueltiger Benutzername oder Passwort');
      }
    }));

    app.post('/api/requestPasswordReset', passwordResetLimiter, asyncHandler(async (req, res) => {
      const expiresMinutes = Number(config?.security?.passwordResetExpiresMinutes || 60);
      const resetRequest = await userController.createPasswordResetToken(req.body?.identifier, expiresMinutes);

      if (resetRequest) {
        const resetUrl = buildPasswordResetUrl(config, resetRequest.token);

        if (resetUrl) {
          await sendPasswordResetMail(config, resetRequest.email, resetUrl, expiresMinutes);
        }
      }

      sendOk(req, res, {
        message: 'Falls ein passender Benutzer existiert, wurde eine E-Mail zum Zuruecksetzen versendet.'
      });
    }));

    app.post('/api/confirmPasswordReset', asyncHandler(async (req, res) => {
      const { token, password } = req.body;

      if (!token || !password) {
        throw createApiError(400, 'RESET_MISSING_FIELDS', 'Token und Passwort sind erforderlich.');
      }

      if (String(password).length < 8) {
        throw createApiError(400, 'RESET_PASSWORD_TOO_SHORT', 'Das Passwort muss mindestens 8 Zeichen lang sein.');
      }

      const result = await userController.resetPasswordByToken(token, password);

      if (result) {
        sendOk(req, res, { result: true, message: 'Passwort wurde erfolgreich geaendert.' });
      } else {
        throw createApiError(400, 'RESET_INVALID_OR_EXPIRED_TOKEN', 'Token ungueltig oder abgelaufen.');
      }
    }));

    app.get('/api/logout', (req, res) => {
      logger.info('/api/logout');
      const token = req.cookies.session_token;

      sessionController.removeSession(token);

      res.clearCookie('session_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
      });

      sendOk(req, res, { message: 'Erfolgreich abgemeldet' });
    });

    app.get('/api/getSession', (req, res) => {
      const token = req.cookies.session_token;

      if (token) {
        const session = sessionController.getSessionByToken(token);

        if (session?.user) {
          const userEnabled = userController.getUserEnabled(session.user);

          session.user.enabled = userEnabled;
        }

        sendOk(req, res, { user: session?.user });
      } else {
        sendOk(req, res, { message: 'Keine session vorhanden' });
      }
    });

    app.get('/api/getUserList', authMiddleware.check('admin'), (req, res) => {
      const token = req.cookies.session_token;

      logger.info('/api/getUserList', token);

      const users = userController.getUsers();

      if (token) {
        sendOk(req, res, { users });
      } else {
        sendOk(req, res, { message: 'Keine session vorhanden' });
      }
    });

    app.post('/api/adduser', authMiddleware.check('admin'), asyncHandler(async (req, res) => {
      logger.fatal('/api/adduser req.body', req.body);
      const newUser = await userController.addUser(req.body);

      if (newUser) {
        sendOk(req, res, { newUser });
      } else {
        throw createApiError(401, 'USER_CREATE_FAILED', 'Fehler beim Anlegen des neuen Users');
      }
    }));

    app.post('/api/updateUser', authMiddleware.check('admin'), asyncHandler(async (req, res) => {
      logger.fatal('/api/updateUser req.body', req.body);
      const result = await userController.updateUser(req.body);

      if (result) {
        sendOk(req, res, { result });
      } else {
        throw createApiError(401, 'USER_UPDATE_FAILED', 'Fehler beim Aendern des Users');
      }
    }));

    app.post('/api/changePassword', authMiddleware.check('benutzer'), asyncHandler(async (req, res) => {
      logger.fatal('/api/changePassword req.body', req.body);
      const result = await userController.changePassword(req.body);

      if (result) {
        sendOk(req, res, { result });
      } else {
        throw createApiError(401, 'USER_CHANGE_PASSWORD_FAILED', 'Fehler beim Aendern des Passworts');
      }
    }));

    app.post('/api/deluser', authMiddleware.check('admin'), asyncHandler(async (req, res) => {
      logger.fatal('/api/deluser req.body', req.body);
      const delUser = await userController.delUser(req.body);

      if (delUser) {
        sendOk(req, res, { delUser: true });
      } else {
        throw createApiError(401, 'USER_DELETE_FAILED', 'Fehler beim Loeschen des Users');
      }
    }));

    // eslint-disable-next-line no-unused-vars
    app.use('/api', (error, req, res, next) => {
      const status = Number(error?.status) || 500;
      const code = error?.code || 'SYS_INTERNAL_ERROR';
      const message = error?.message || 'Interner Serverfehler';
      const details = error?.details || null;
      const requestId = ensureRequestId(req);

      logger.error('API error', {
        requestId,
        path: req.path,
        method: req.method,
        status,
        code,
        message,
        details,
        error
      });

      sendError(req, res, status, code, message, details);
    });
  }
};

export default apiRoutes;
