/* eslint-disable class-methods-use-this */
// userController.mjs
import dbController from './dbController.js';
import logger from '../logger.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class UserController {
  getUsers (onlyEnabled = false) {
    try {
      let users;

      if (onlyEnabled) {
        users = dbController.prepare('SELECT id, password, username, email, enabled, roles FROM users WHERE enabled = ?').all('1');
      } else {
        users = dbController.prepare('SELECT id, password, username, email, enabled, roles FROM users').all();
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
      const stmt = dbController.prepare('SELECT id, password, username, email, enabled, roles FROM users WHERE username = ? COLLATE NOCASE');
      const user = stmt.get(username);

      return user;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Benutzer:', error);
    }
  }

  getUserEnabled (user) {
    try {
      const stmt = dbController.prepare('SELECT enabled FROM users WHERE id = ?');
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
      INSERT INTO users (username, email, password, roles, enabled)
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
      UPDATE users
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
      UPDATE users
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
    const stmt = dbController.prepare(`DELETE FROM users WHERE id = ?`);

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

  hashResetToken (token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  createResetTokenValue () {
    return crypto.randomBytes(32).toString('hex');
  }

  findUserByIdentifier (identifier) {
    const normalized = String(identifier || '').trim();

    if (!normalized) {
      return null;
    }

    const stmt = dbController.prepare(`
      SELECT id, username, email, enabled
      FROM users
      WHERE LOWER(username) = LOWER(?) OR LOWER(COALESCE(email, '')) = LOWER(?)
      LIMIT 1
    `);

    return stmt.get(normalized, normalized);
  }

  invalidateOpenResetTokens (userId) {
    const stmt = dbController.prepare(`
      UPDATE password_reset_token
      SET used_at = ?
      WHERE user_id = ? AND used_at IS NULL
    `);

    stmt.run(new Date().toISOString(), userId);
  }

  cleanupExpiredResetTokens () {
    const stmt = dbController.prepare(`
      DELETE FROM password_reset_token
      WHERE expires_at <= ? OR used_at IS NOT NULL
    `);

    stmt.run(new Date().toISOString());
  }

  async createPasswordResetToken (identifier, expiresMinutes = 60) {
    const user = this.findUserByIdentifier(identifier);

    if (!user || user.enabled !== '1' || !user.email) {
      return null;
    }

    this.cleanupExpiredResetTokens();

    const rawToken = this.createResetTokenValue();
    const tokenHash = this.hashResetToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (Number(expiresMinutes) * 60 * 1000)).toISOString();

    this.invalidateOpenResetTokens(user.id);

    const insert = dbController.prepare(`
      INSERT INTO password_reset_token (user_id, token_hash, expires_at, used_at, created_at)
      VALUES (?, ?, ?, NULL, ?)
    `);

    insert.run(user.id, tokenHash, expiresAt, now.toISOString());

    logger.info('Password reset token generated', {
      userId: user.id,
      username: user.username
    });

    return {
      token: rawToken,
      email: user.email,
      userId: user.id,
      expiresAt
    };
  }

  async resetPasswordByToken (token, password) {
    if (!token || !password) {
      return false;
    }

    const tokenHash = this.hashResetToken(String(token));
    const nowIso = new Date().toISOString();

    const tokenRow = dbController.prepare(`
      SELECT id, user_id
      FROM password_reset_token
      WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
      LIMIT 1
    `).get(tokenHash, nowIso);

    if (!tokenRow) {
      return false;
    }

    const passHash = await this.hashPassword(password);
    const updateUser = dbController.prepare(`UPDATE users SET password = ? WHERE id = ?`);
    const markUsed = dbController.prepare(`UPDATE password_reset_token SET used_at = ? WHERE id = ?`);
    const invalidateRest = dbController.prepare(`
      UPDATE password_reset_token
      SET used_at = ?
      WHERE user_id = ? AND used_at IS NULL AND id != ?
    `);

    const tx = dbController.db.transaction(() => {
      updateUser.run(passHash, tokenRow.user_id);
      markUsed.run(nowIso, tokenRow.id);
      invalidateRest.run(nowIso, tokenRow.user_id, tokenRow.id);
    });

    tx();

    return true;
  }
}

export default new UserController();
