/* eslint-disable callback-return */
import sessionController from '../api/sessionController.js';
import { sendError } from '../api/apiResponse.js';
import logger from '../logger.js';
import jwt from 'jsonwebtoken';

class AuthMiddleware {
  constructor () {
    this.secret = null;
    this.cookieOptions = {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      path: '/'
    };
  }

  setSecret (secret) {
    this.secret = secret;
  }

  setCookieOptions (cookieOptions) {
    this.cookieOptions = {
      ...this.cookieOptions,
      ...cookieOptions
    };
  }

  // Dummy-Funktion zur Überprüfung des Tokens (Anpassbar)
  verifyToken (token) {
    try {
      // Überprüfe den Token und dekodiere die Payload
      const decoded = jwt.verify(token, this.secret);

      return decoded; // Gibt die dekodierte Payload zurück, wenn der Token gültig ist
    } catch (err) {
      logger.error('Token ungültig oder abgelaufen', err);

      // Wenn der Token ungültig oder abgelaufen ist, gebe false zurück oder werfe einen Fehler
      return false; // Hier kannst du auch Fehlerbehandlung einfügen, wenn gewünscht
    }
  }

  // Authentifizierungs-Middleware
  check (requiredRole) {
    return (req, res, next) => {
      const token = req.cookies.session_token;

      if (token) {
        const decoded = this.verifyToken(token);

        if (decoded) {
          // Rolle des Benutzers überprüfen
          if (requiredRole && !decoded.user.roles.includes(requiredRole)) {
            return sendError(req, res, 403, 'AUTH_INSUFFICIENT_PERMISSIONS', 'Zugriff verweigert: Unzureichende Berechtigungen');
          }

          // token verlängern
          const newToken = sessionController.extendToken(token);

          // cookie neu mit verlängertem token neu setzen
          res.cookie('session_token', newToken, this.cookieOptions);

          // Wenn alles passt, rufe next() auf
          next();
        } else {
          return sendError(req, res, 401, 'AUTH_SESSION_EXPIRED', 'session ist abgelaufen', { token: false });
        }
      } else {
        return sendError(req, res, 401, 'AUTH_NO_SESSION', 'keine session vorhanden', { token: false });
      }

      return null;
    };
  }
}

export default new AuthMiddleware();
