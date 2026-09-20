import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : (err.status || 500);
  const message = err.code === 'LIMIT_FILE_SIZE'
    ? 'File is too large. Maximum size is 5 MB.'
    : (err.message || 'Internal server error');

  if (env.nodeEnv !== 'test') {
    console.error('[error]', message);
  }

  res.status(status).json({
    success: false,
    error: env.nodeEnv === 'production' && status === 500 ? 'Internal server error' : message
  });
}
