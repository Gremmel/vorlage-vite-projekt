/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable no-sync */
// db.mjs
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger.js';

// Bestimme das Root-Verzeichnis des Projekts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

function getMigrationFilesFromDisk () {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs.readdirSync(migrationsDir).filter((entry) => entry.endsWith('.sql')).sort((left, right) => left.localeCompare(right, 'en')).map((entry) => ({
    filename: entry,
    fullPath: path.join(migrationsDir, entry)
  }));
}

class DatabaseController {
  constructor (dbPath) {
    this.db = new Database(dbPath, { verbose: console.log });
    this.runMigrations();
    logger.info('Datenbankverbindung hergestellt und Migrationen ausgefuehrt.');
  }

  ensureMigrationsTable () {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL
      )
    `).run();
  }

  hasMigrationRun (filename) {
    const row = this.db.prepare('SELECT id FROM schema_migrations WHERE filename = ? LIMIT 1').get(filename);

    return Boolean(row);
  }

  runMigration (migration) {
    const sql = fs.readFileSync(migration.fullPath, 'utf8');

    if (!sql.trim()) {
      logger.warn('Migration ohne Inhalt uebersprungen:', migration.filename);

      return;
    }

    const nowIso = new Date().toISOString();
    const transaction = this.db.transaction(() => {
      this.db.exec(sql);
      this.db.prepare('INSERT INTO schema_migrations (filename, executed_at) VALUES (?, ?)').run(migration.filename, nowIso);
    });

    transaction();
    logger.info('Migration ausgefuehrt:', migration.filename);
  }

  runMigrations () {
    this.ensureMigrationsTable();

    const migrations = getMigrationFilesFromDisk();

    for (const migration of migrations) {
      if (this.hasMigrationRun(migration.filename)) {
        continue;
      }

      this.runMigration(migration);
    }
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
