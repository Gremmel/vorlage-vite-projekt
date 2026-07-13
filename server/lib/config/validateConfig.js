import logger from '../logger.js';

function hasText (value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function toPositiveInt (value) {
  const number = Number(value);

  if (Number.isInteger(number) && number > 0) {
    return number;
  }

  return null;
}

function hasSmtpEnvConfig () {
  // eslint-disable-next-line no-process-env
  const host = process.env.SMTP_HOST;
  // eslint-disable-next-line no-process-env
  const user = process.env.SMTP_USER;
  // eslint-disable-next-line no-process-env
  const pass = process.env.SMTP_PASS;
  // eslint-disable-next-line no-process-env
  const from = process.env.SMTP_FROM;

  return hasText(host) && hasText(user) && hasText(pass) && hasText(from);
}

function hasSmtpFileConfig (config) {
  const smtp = config?.smtp || {};

  return hasText(smtp.host) &&
    toPositiveInt(smtp.port) &&
    hasText(smtp.user) &&
    hasText(smtp.pass) &&
    hasText(smtp.from);
}

function validateRateLimit (errors, sectionName, section) {
  if (!section) {
    return;
  }

  const windowMs = toPositiveInt(section.windowMs);
  const max = toPositiveInt(section.max);

  if (!windowMs) {
    errors.push(`security.rateLimit.${sectionName}.windowMs muss eine positive Ganzzahl sein.`);
  }

  if (!max) {
    errors.push(`security.rateLimit.${sectionName}.max muss eine positive Ganzzahl sein.`);
  }
}

function validateCors (errors, warnings, config) {
  const cors = config?.cors;

  if (!cors) {
    warnings.push('cors fehlt. Es werden die Default-Origins aus dem Code verwendet.');

    return;
  }

  const origins = cors.origins;

  if (!Array.isArray(origins) || origins.length === 0) {
    errors.push('cors.origins muss ein nicht-leeres Array sein.');

    return;
  }

  const invalidOrigin = origins.find((origin) => !hasText(origin));

  if (invalidOrigin !== undefined) {
    errors.push('cors.origins darf nur nicht-leere Strings enthalten.');
  }

  if (cors.methods !== undefined) {
    if (!Array.isArray(cors.methods) || cors.methods.length === 0) {
      errors.push('cors.methods muss ein nicht-leeres Array sein, falls gesetzt.');

      return;
    }

    const invalidMethod = cors.methods.find((method) => !hasText(method));

    if (invalidMethod !== undefined) {
      errors.push('cors.methods darf nur nicht-leere Strings enthalten.');
    }
  }
}

function validateSecurityOptions (errors, config) {
  const cookies = config?.security?.cookies;

  if (!cookies) {
    return;
  }

  if (cookies.secure !== undefined && typeof cookies.secure !== 'boolean') {
    errors.push('security.cookies.secure muss boolean sein.');
  }

  if (cookies.sameSite !== undefined) {
    const sameSite = String(cookies.sameSite || '').trim().toLowerCase();

    if (![ 'strict', 'lax', 'none' ].includes(sameSite)) {
      errors.push('security.cookies.sameSite muss strict, lax oder none sein.');
    }
  }

  if (config?.security?.trustProxy !== undefined && typeof config.security.trustProxy !== 'boolean') {
    errors.push('security.trustProxy muss boolean sein.');
  }
}

export default function validateConfig (config) {
  const errors = [];
  const warnings = [];

  if (!config || typeof config !== 'object') {
    errors.push('Konfiguration fehlt oder hat ein ungueltiges Format.');
  }

  if (!hasText(config?.JWT?.secret)) {
    errors.push('JWT.secret fehlt.');
  }

  const port = toPositiveInt(config?.express?.port);

  if (!port || port > 65535) {
    errors.push('express.port muss zwischen 1 und 65535 liegen.');
  }

  const resetMinutes = toPositiveInt(config?.security?.passwordResetExpiresMinutes);

  if (!resetMinutes) {
    errors.push('security.passwordResetExpiresMinutes muss eine positive Ganzzahl sein.');
  }

  validateRateLimit(errors, 'login', config?.security?.rateLimit?.login);
  validateRateLimit(errors, 'passwordReset', config?.security?.rateLimit?.passwordReset);
  validateCors(errors, warnings, config);
  validateSecurityOptions(errors, config);

  if (!hasText(config?.ui?.baseUrl)) {
    warnings.push('ui.baseUrl fehlt. Passwort-Reset-Links koennen dann nicht korrekt erzeugt werden.');
  }

  if (!hasSmtpEnvConfig() && !hasSmtpFileConfig(config)) {
    warnings.push('SMTP ist nicht vollstaendig konfiguriert. Passwort-Reset-E-Mails koennen nicht versendet werden.');
  }

  warnings.forEach((warning) => logger.warn('Config warning:', warning));

  if (errors.length > 0) {
    const message = errors.join(' | ');

    throw new Error(message);
  }
}
