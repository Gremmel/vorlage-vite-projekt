/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
// db.mjs
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger.js';

// Bestimme das Root-Verzeichnis des Projekts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseController {
  constructor (dbPath) {
    this.db = new Database(dbPath, { verbose: console.log });
    this.ensureTablesAndColumns();
    logger.info('Datenbankverbindung hergestellt und Tabellen/Spalten überprüft.');
  }

  /**
   * Stellt sicher, dass die fuer die Benutzerverwaltung benoetigten Tabellen existieren.
   */
  ensureTablesAndColumns () {
    this.db.prepare(`CREATE TABLE IF NOT EXISTS fos_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password TEXT NOT NULL,
      roles TEXT NOT NULL DEFAULT '["benutzer"]',
      enabled TEXT NOT NULL DEFAULT '1'
    )`).run();
  }

  prepare (query) {
    return this.db.prepare(query);
  }

  close () {
    this.db.close();
  }
}

const dbPath = path.join(__dirname, '..', '..', '..', 'extern', 'datenbank.db');
const dbController = new DatabaseController(dbPath);

export default dbController;
