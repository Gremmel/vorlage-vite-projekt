import express from 'express';
import { fileURLToPath } from 'url';
import http from 'http';
import logger from './logger.js';
import path from 'path';
import cookieParser from 'cookie-parser'; // Für das Cookie-Parsing
import cors from 'cors'; // Importiere CORS brauchen wir das wir die routen vom devserver aus aufrufen können
import helmet from 'helmet';
import apiRoutes from './api/apiRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';

// ESM braucht __dirname-Ersatz
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const defaultCorsOrigins = [ 'http://localhost:5173', 'http://192.168.201.42:5173' ];
const defaultCorsMethods = [ 'GET', 'POST' ];

function getCorsOrigins (config) {
  const origins = config?.cors?.origins;

  if (!Array.isArray(origins) || origins.length === 0) {
    return defaultCorsOrigins;
  }

  const sanitizedOrigins = origins.map((origin) => typeof origin === 'string' ? origin.trim() : '').filter(Boolean);

  if (sanitizedOrigins.length === 0) {
    return defaultCorsOrigins;
  }

  return sanitizedOrigins;
}

function getCorsMethods (config) {
  const methods = config?.cors?.methods;

  if (!Array.isArray(methods) || methods.length === 0) {
    return defaultCorsMethods;
  }

  const sanitizedMethods = methods.map((method) => typeof method === 'string' ? method.trim().toUpperCase() : '').filter(Boolean);

  if (sanitizedMethods.length === 0) {
    return defaultCorsMethods;
  }

  return sanitizedMethods;
}

const expressApp = {
  app: express(),
  server: undefined,
  port: 3000,

  init (config) {
    authMiddleware.setSecret(config.JWT.secret);

    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    // Verwende CORS für alle Routen
    this.app.use(cors({
      origin: getCorsOrigins(config),
      methods: getCorsMethods(config),
      credentials: true // Wenn du Cookies oder Anmeldeinformationen sendest
    }));

    // 1 steht für "einen Proxy" wie Nginx
    // Dies teilt Express mit, dass es den X-Forwarded-*-Headern, die vom Proxy gesendet werden
    // (wie X-Forwarded-Proto für das Protokoll), vertrauen soll. Dadurch wird Express bewusst,
    // dass die ursprüngliche Verbindung tatsächlich über HTTPS war, und es erlaubt das Setzen von Cookies mit dem secure-Flag.
    // this.app.set('trust proxy', 1);

    // Middleware zum Parsen von Cookies
    this.app.use(express.json());
    this.app.use(cookieParser());

    apiRoutes.init(this.app, config);

    // Vue ausliefern
    this.app.use(express.static(path.join(dirname, '..', '..', 'ui', 'dist')));

    // Alle anderen Routen zur Vue-App leiten
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(path.join(dirname, '..', '..', 'ui', 'dist', 'index.html')));
    });

    if (config?.express?.port) {
      this.port = config.express.port;
    }

    this.server = http.createServer(this.app);
  },

  start () {
    this.server.listen(this.port, () => {
      logger.info('App listening on port', this.port);
    });
  }
};

export default expressApp;
