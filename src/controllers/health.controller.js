import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getHealth = asyncHandler(async (req, res) => {
  let database = 'disconnected';
  try {
    await pool.query('SELECT 1');
    database = 'connected';
  } catch {
    database = 'disconnected';
  }

  res.json({
    status: database === 'connected' ? 'online' : 'degraded',
    service: 'DAV Civil Services API',
    version: '1.0.0',
    environment: env.nodeEnv,
    database,
    timestamp: new Date().toISOString()
  });
});
