import nodemailer from 'nodemailer';
import logger from '../logger.js';

function readEnvValue (key) {
  // eslint-disable-next-line no-process-env
  const value = process.env[key];

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function parseBool (value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if ([ 'true', '1', 'yes', 'on' ].includes(normalized)) {
      return true;
    }

    if ([ 'false', '0', 'no', 'off' ].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function parsePort (value) {
  const number = Number(value);

  if (Number.isInteger(number) && number > 0) {
    return number;
  }

  return null;
}

function getSmtpConfig (config) {
  const smtp = config?.smtp || {};
  const envHost = readEnvValue('SMTP_HOST');
  const envPort = parsePort(readEnvValue('SMTP_PORT'));
  const envSecure = parseBool(readEnvValue('SMTP_SECURE'));
  const envUser = readEnvValue('SMTP_USER');
  const envPass = readEnvValue('SMTP_PASS');
  const envFrom = readEnvValue('SMTP_FROM');
  const filePort = parsePort(smtp.port);
  const fileSecure = parseBool(smtp.secure);

  return {
    host: envHost || smtp.host || null,
    port: envPort ?? filePort,
    secure: envSecure ?? fileSecure,
    user: envUser || smtp.user || null,
    pass: envPass || smtp.pass || null,
    from: envFrom || smtp.from || null
  };
}

function getUiBaseUrl (config) {
  const envBaseUrl = readEnvValue('UI_BASE_URL');
  const baseUrl = String(envBaseUrl || config?.ui?.baseUrl || '').trim();

  if (!baseUrl) {
    return null;
  }

  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function createTransporter (config) {
  const smtp = getSmtpConfig(config);

  if (!smtp.host || !smtp.port || smtp.secure === null || !smtp.user || !smtp.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port),
    secure: Boolean(smtp.secure),
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });
}

export function buildPasswordResetUrl (config, token) {
  const baseUrl = getUiBaseUrl(config);

  if (!baseUrl || !token) {
    return null;
  }

  return `${baseUrl}/resetPassword?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetMail (config, recipientEmail, resetUrl, expiresMinutes) {
  const transporter = createTransporter(config);
  const smtp = getSmtpConfig(config);

  if (!transporter || !smtp?.from || !recipientEmail || !resetUrl) {
    logger.warn('Password reset mail skipped: SMTP oder Reset-URL nicht korrekt konfiguriert.');

    return false;
  }

  await transporter.sendMail({
    from: smtp.from,
    to: recipientEmail,
    subject: 'Passwort zuruecksetzen',
    text: [
      'Du hast ein Zuruecksetzen deines Passworts angefordert.',
      '',
      `Der Link ist ${expiresMinutes} Minuten gueltig:`,
      resetUrl,
      '',
      'Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren.'
    ].join('\n'),
    html: `
      <p>Du hast ein Zuruecksetzen deines Passworts angefordert.</p>
      <p>Der Link ist <strong>${expiresMinutes} Minuten</strong> gueltig:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
    `
  });

  return true;
}
