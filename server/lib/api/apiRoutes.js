import logger from '../logger.js';
import authMiddleware from '../middleware/authMiddleware.js';
import loginController from './loginController.js';
import sessionController from './sessionController.js';
import userController from './userController.js';

const apiRoutes = {
  init (app, config) {
    sessionController.init(config);

    app.post('/api/login', async (req, res) => {
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

        res.json({ user });
      } else {
        logger.error('Ungueltiger Benutzername oder Passwort', username);
        res.status(401).json({ message: 'Ungueltiger Benutzername oder Passwort' });
      }
    });

    app.get('/api/logout', (req, res) => {
      logger.info('/api/logout');
      const token = req.cookies.session_token;

      sessionController.removeSession(token);

      res.clearCookie('session_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
      });
      res.json({ message: 'Erfolgreich abgemeldet' });
    });

    app.get('/api/getSession', (req, res) => {
      const token = req.cookies.session_token;

      if (token) {
        const session = sessionController.getSessionByToken(token);

        if (session?.user) {
          const userEnabled = userController.getUserEnabled(session.user);

          session.user.enabled = userEnabled;
        }

        res.json({ user: session?.user });
      } else {
        res.json({ message: 'Keine session vorhanden' });
      }
    });

    app.get('/api/getUserList', authMiddleware.check('admin'), (req, res) => {
      const token = req.cookies.session_token;

      logger.info('/api/getUserList', token);

      const users = userController.getUsers();

      if (token) {
        res.json({ users });
      } else {
        res.json({ message: 'Keine session vorhanden' });
      }
    });

    app.post('/api/adduser', authMiddleware.check('admin'), async (req, res) => {
      logger.fatal('/api/adduser req.body', req.body);
      const newUser = await userController.addUser(req.body);

      if (newUser) {
        res.json({ newUser });
      } else {
        res.status(401).json({ message: 'Fehler beim Anlegen des neuen Users' });
      }
    });

    app.post('/api/updateUser', authMiddleware.check('admin'), async (req, res) => {
      logger.fatal('/api/updateUser req.body', req.body);
      const result = await userController.updateUser(req.body);

      if (result) {
        res.json({ result });
      } else {
        res.status(401).json({ message: 'Fehler beim Aendern des Users' });
      }
    });

    app.post('/api/changePassword', authMiddleware.check('benutzer'), async (req, res) => {
      logger.fatal('/api/changePassword req.body', req.body);
      const result = await userController.changePassword(req.body);

      if (result) {
        res.json({ result });
      } else {
        res.status(401).json({ message: 'Fehler beim Aendern des Passworts' });
      }
    });

    app.post('/api/deluser', authMiddleware.check('admin'), async (req, res) => {
      logger.fatal('/api/deluser req.body', req.body);
      const delUser = await userController.delUser(req.body);

      if (delUser) {
        res.json({ delUser: true });
      } else {
        res.status(401).json({ message: 'Fehler beim Loeschen des Users' });
      }
    });
  }
};

export default apiRoutes;
