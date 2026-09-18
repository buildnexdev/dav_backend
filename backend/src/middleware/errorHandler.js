import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (env.nodeEnv !== 'test') {
    console.error('[error]', message);
  }

  res.status(status).json({
    success: false,
    error: env.nodeEnv === 'production' && status === 500 ? 'Internal server error' : message
  });
}
