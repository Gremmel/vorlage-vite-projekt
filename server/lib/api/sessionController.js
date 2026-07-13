/* eslint-disable no-sync */
import jwt from 'jsonwebtoken';
import logger from '../logger.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const sessionController = {
  sessions: [],
  config: null,
  sessionsFilePath: null,

  init (config) {
    this.config = config;
    this.sessionsFilePath = path.join(dirname, 'sessions.json');

    if (fs.existsSync(this.sessionsFilePath)) {
      try {
        logger.info('Lade Sessions aus Datei');
        this.sessions = fs.readJSONSync(this.sessionsFilePath);
      } catch (error) {
        logger.error('Fehler beim Laden der Sessions:', error);
        try {
          fs.removeSync(this.sessionsFilePath);
        } catch (errorDel) {
          logger.error('Fehler beim Löschen der korrupten Sessions-Datei:', errorDel);
        }
        this.sessions = [];
      }
    }
  },

  async writeSessionToFile () {
    try {
      fs.writeJSON(this.sessionsFilePath, this.sessions, { spaces: 2 });
    } catch (error) {
      logger.error('Fehler beim Schreiben der Sessions:', error);
    }
  },

  extendToken (oldToken) {
    try {
      // Verifiziere das alte Token
      const decoded = jwt.verify(oldToken, this.config.JWT.secret);

      // Entferne sensible Felder wie `iat` und `exp` aus dem alten Token
      // eslint-disable-next-line no-unused-vars
      const { iat, exp, ...rest } = decoded;

      // Erstelle ein neues Token mit einer neuen Ablaufzeit
      const newToken = jwt.sign(rest, this.config.JWT.secret, { expiresIn: '30d' });

      // token in session austauschen
      for (const session of this.sessions) {
        if (session.token === oldToken) {
          session.token = newToken;
        }
      }

      this.writeSessionToFile();

      return newToken;
    } catch (error) {
      logger.error('Fehler beim Verlängern des Tokens:', error);

      return null;
    }
  },

  addSession (user) {
    const token = jwt.sign({ user }, this.config.JWT.secret, { expiresIn: '30d' });

    const session = {
      token,
      user
    };

    this.sessions.push(session);

    this.writeSessionToFile();

    return token;
  },

  removeSession (token) {
    const index = this.sessions.findIndex((session) => session.token === token);

    if (index !== -1) {
      this.sessions.splice(index, 1);
    }

    this.writeSessionToFile();
  },

  getSessionByToken (token) {
    for (const session of this.sessions) {
      if (session.token === token) {
        return session;
      }
    }

    return null;
  }
};

export default sessionController;
