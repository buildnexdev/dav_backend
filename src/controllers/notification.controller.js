import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextCode } from '../db/codes.js';

const STATUSES = ['Active', 'Inactive'];
export const NOTIFICATION_TYPES = ['Exam', 'Fee', 'Academic', 'Scholarship', 'General'];
export const NOTIFICATION_CHANNELS = ['Email', 'SMS', 'WhatsApp', 'Push Notification'];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

export function mapNotification(row) {
  return {
    id: row.id,
    notificationCode: row.notification_code,
    title: row.title,
    message: row.message || '',
    type: row.type || '',
    channel: row.channel || '',
    publishedDate: row.published_date ? String(row.published_date).slice(0, 10) : '',
    status: row.status,
    updatedAt: row.updated_at || ''
  };
}

function notificationFields(body) {
  return {
    title: String(body.title || '').trim(),
    message: emptyToNull(body.message),
    type: emptyToNull(body.type),
    channel: emptyToNull(body.channel),
    published_date: emptyToNull(body.publishedDate),
    status: STATUSES.includes(body.status) ? body.status : 'Active'
  };
}

export const listNotifications = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('(notification_code LIKE ? OR title LIKE ? OR message LIKE ? OR type LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (STATUSES.includes(status)) {
    clauses.push('status = ?');
    params.push(status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM notifications${where} ORDER BY published_date DESC, id DESC`, params);
  res.json({ success: true, notifications: rows.map(mapNotification) });
});

export const listPublicNotifications = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM notifications WHERE status = 'Active' ORDER BY published_date DESC, id DESC");
  res.json({ success: true, notifications: rows.map(mapNotification) });
});

export const getNotification = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Notification not found.' });
  res.json({ success: true, notification: mapNotification(rows[0]) });
});

export const createNotification = asyncHandler(async (req, res) => {
  const fields = notificationFields(req.body);
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const code = await nextCode(pool, 'notifications', 'notification_code', 'NOT');
  const data = { notification_code: code, ...fields };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO notifications (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, notification: mapNotification(rows[0]) });
});

export const updateNotification = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Notification not found.' });
  const fields = notificationFields({ ...mapNotification(existing[0]), ...req.body });
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const keys = Object.keys(fields);
  await pool.query(
    `UPDATE notifications SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(fields), req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
  res.json({ success: true, notification: mapNotification(rows[0]) });
});

export const setNotificationStatus = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM notifications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Notification not found.' });
  const status = STATUSES.includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  await pool.query('UPDATE notifications SET status = ? WHERE id = ?', [status, req.params.id]);
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
  res.json({ success: true, notification: mapNotification(rows[0]) });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM notifications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Notification not found.' });
  await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Notification deleted.' });
});
