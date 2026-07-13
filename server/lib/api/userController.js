/* eslint-disable class-methods-use-this */
// userController.mjs
import dbController from './dbController.js';
import logger from '../logger.js';
import bcrypt from 'bcrypt';

class UserController {
  getUsers (onlyEnabled = false) {
    try {
      let users;

      if (onlyEnabled) {
        users = dbController.prepare('SELECT id, password, username, email, enabled, roles FROM fos_user WHERE enabled = ?').all('1');
      } else {
        users = dbController.prepare('SELECT id, password, username, email, enabled, roles FROM fos_user').all();
      }

      // passwort hash entfernen
      for (const user of users) {
        delete user.password;
      }

      return users;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Benutzer:', error);
    }
  }

  getUserByName (username) {
    try {
      const stmt = dbController.prepare('SELECT id, password, username, email, enabled, roles FROM fos_user WHERE username = ? COLLATE NOCASE');
      const user = stmt.get(username);

      return user;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Benutzer:', error);
    }
  }

  getUserEnabled (user) {
    try {
      const stmt = dbController.prepare('SELECT enabled FROM fos_user WHERE id = ?');
      const res = stmt.get(user.id);

      return res.enabled;
    } catch (error) {
      logger.error('Fehler beim Abrufen des Benutzers:', error);
    }
  }

  async hashPassword (password) {
    const saltRounds = 13; // Je höher die Zahl, desto sicherer, aber langsamer

    try {
      const hash = await bcrypt.hash(password, saltRounds);

      return hash; // Gibt den erzeugten Hash zurück
    } catch (error) {
      logger.error('Fehler beim Erzeugen des Passwort-Hashes:', error);
      throw error; // Fehler weiterleiten, damit der Aufrufer ihn behandeln kann
    }
  }

  async addUser (user) {
    const { username, email, password, roles, enabled } = user;

    const passHash = await this.hashPassword(password);

    logger.info('new hash', passHash);

    const stmt = dbController.prepare(`
      INSERT INTO fos_user (username, email, password, roles, enabled)
      VALUES (?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(username, email, passHash, roles, enabled);
      logger.info(`User ${username} added successfully.`);

      return true;
    } catch (error) {
      logger.error(`Error adding user: ${error.message}`);

      return false;
    }
  }

  async updateUser (user) {
    const { id, username, email, password, roles, enabled } = user;

    let passHash = null;

    if (password) {
      passHash = await this.hashPassword(password);
      logger.info('updated hash', passHash);
    }

    const stmt = dbController.prepare(`
      UPDATE fos_user
      SET username = ?, email = ?, password = COALESCE(?, password), roles = ?, enabled = ?
      WHERE id = ?
    `);

    try {
      const result = stmt.run(username, email, passHash, roles, enabled, id);

      logger.info(`User ${username} updated successfully.`, result);

      if (result.changes === 1) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);

      return false;
    }
  }

  async changePassword (user) {
    const { id, password } = user;

    let passHash = null;

    if (password) {
      passHash = await this.hashPassword(password);
      logger.info('updated hash', passHash);
    }

    const stmt = dbController.prepare(`
      UPDATE fos_user
      SET password = COALESCE(?, password)
      WHERE id = ?
    `);

    try {
      const result = stmt.run(passHash, id);

      logger.info(`Password changed successfully.`, result);

      if (result.changes === 1) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error changing password: ${error.message}`);

      return false;
    }
  }

  async delUser (user) {
    const { id } = user;

    if (!id) {
      return false;
    }

    // Verwende Platzhalter für eine sichere SQL-Abfrage
    const stmt = dbController.prepare(`DELETE FROM fos_user WHERE id = ?`);

    try {
      const result = stmt.run(id);

      if (result.changes === 1) {
        logger.info(`User ${id} erfolgreich gelöscht.`, result);

        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error adding user: ${error.message}`);

      return false;
    }
  }
}

export default new UserController();
