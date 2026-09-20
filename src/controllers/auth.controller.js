import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

export const login = asyncHandler(async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.password_hash, u.is_active, r.name AS role
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.username = ?
     LIMIT 1`,
    [username]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ success: false, error: 'This account is inactive.' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  const token = signToken(user);
  res.json({
    success: true,
    token,
    user: publicUser(user)
  });
});

export const me = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.is_active, r.name AS role
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [req.user.id]
  );

  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
  }

  res.json({ success: true, user: publicUser(user) });
});
