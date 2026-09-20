import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextCode } from '../db/codes.js';

const STATUSES = ['Active', 'Inactive'];
export const NEWS_CATEGORIES = [
  'Exam Updates',
  'Program Events',
  'Admission Updates',
  'Government Schemes',
  'Latest Notifications'
];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

export function mapNews(row) {
  return {
    id: row.id,
    newsCode: row.news_code,
    title: row.title,
    category: row.category || '',
    publishedDate: row.published_date ? String(row.published_date).slice(0, 10) : '',
    description: row.description || '',
    content: row.content || '',
    status: row.status,
    updatedAt: row.updated_at || ''
  };
}

function newsFields(body) {
  return {
    title: String(body.title || '').trim(),
    category: emptyToNull(body.category),
    published_date: emptyToNull(body.publishedDate),
    description: emptyToNull(body.description),
    content: emptyToNull(body.content),
    status: STATUSES.includes(body.status) ? body.status : 'Active'
  };
}

export const listNews = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('(news_code LIKE ? OR title LIKE ? OR category LIKE ? OR description LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (STATUSES.includes(status)) {
    clauses.push('status = ?');
    params.push(status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM news${where} ORDER BY published_date DESC, id DESC`, params);
  res.json({ success: true, news: rows.map(mapNews) });
});

export const listPublicNews = asyncHandler(async (req, res) => {
  const category = String(req.query.category || '').trim();
  const params = [];
  let sql = "SELECT * FROM news WHERE status = 'Active'";
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY published_date DESC, id DESC';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, news: rows.map(mapNews) });
});

export const getNews = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM news WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'News item not found.' });
  res.json({ success: true, item: mapNews(rows[0]) });
});

export const createNews = asyncHandler(async (req, res) => {
  const fields = newsFields(req.body);
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const code = await nextCode(pool, 'news', 'news_code', 'NEWS');
  const data = { news_code: code, ...fields };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO news (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, item: mapNews(rows[0]) });
});

export const updateNews = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM news WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'News item not found.' });
  const fields = newsFields({ ...mapNews(existing[0]), ...req.body });
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const keys = Object.keys(fields);
  await pool.query(
    `UPDATE news SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(fields), req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
  res.json({ success: true, item: mapNews(rows[0]) });
});

export const setNewsStatus = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM news WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'News item not found.' });
  const status = STATUSES.includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  await pool.query('UPDATE news SET status = ? WHERE id = ?', [status, req.params.id]);
  const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
  res.json({ success: true, item: mapNews(rows[0]) });
});

export const deleteNews = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM news WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'News item not found.' });
  await pool.query('DELETE FROM news WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'News item deleted.' });
});
