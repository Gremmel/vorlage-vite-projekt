import crypto from 'crypto';

export class ApiError extends Error {
  constructor (status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createApiError (status, code, message, details = null) {
  return new ApiError(status, code, message, details);
}

const requestIds = new WeakMap();

export function ensureRequestId (req) {
  if (requestIds.has(req)) {
    return requestIds.get(req);
  }

  const requestId = crypto.randomUUID();

  requestIds.set(req, requestId);

  return requestId;
}

export function sendOk (req, res, payload = {}, status = 200) {
  const requestId = ensureRequestId(req);

  return res.status(status).json({
    ok: true,
    requestId,
    ...payload
  });
}

export function sendError (req, res, status, code, message, details = null) {
  const requestId = ensureRequestId(req);

  return res.status(status).json({
    ok: false,
    requestId,
    message,
    error: {
      code,
      message,
      details
    }
  });
}

export function asyncHandler (handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
}
