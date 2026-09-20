import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const TYPES = ['Class', 'Test', 'Assignment', 'Mentorship', 'Schedule'];
const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function mapAcademic(row) {
  return {
    id: row.id,
    academicCode: row.academic_code,
    title: row.title,
    type: row.type,
    subject: row.subject || '',
    program: row.program || '',
    batch: row.batch || '',
    mentorId: row.mentor_id || '',
    mentorName: row.mentor_name || '',
    sessionDate: row.session_date ? String(row.session_date).slice(0, 10) : '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    venue: row.venue || '',
    description: row.description || '',
    status: row.status
  };
}

function academicFields(body) {
  return {
    title: String(body.title || '').trim(),
    type: TYPES.includes(body.type) ? body.type : 'Class',
    subject: emptyToNull(body.subject),
    program: emptyToNull(body.program),
    batch: emptyToNull(body.batch),
    mentor_id: body.mentorId ? Number(body.mentorId) || null : null,
    session_date: emptyToNull(body.sessionDate),
    start_time: emptyToNull(body.startTime),
    end_time: emptyToNull(body.endTime),
    venue: emptyToNull(body.venue),
    description: emptyToNull(body.description),
    status: STATUSES.includes(body.status) ? body.status : 'Upcoming'
  };
}

const SELECT_SQL = `
  SELECT a.*, m.name AS mentor_name
  FROM academics a
  LEFT JOIN mentors m ON m.id = a.mentor_id
`;

async function nextCode(conn) {
  const [rows] = await conn.query(
    "SELECT academic_code FROM academics WHERE academic_code LIKE 'ACD%' ORDER BY CAST(SUBSTRING(academic_code, 4) AS UNSIGNED) DESC LIMIT 1"
  );
  if (!rows.length) return 'ACD001';
  const current = Number(String(rows[0].academic_code).replace(/\D/g, '')) || 0;
  return `ACD${String(current + 1).padStart(3, '0')}`;
}

export const listAcademics = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const type = String(req.query.type || '').trim();
  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('(a.academic_code LIKE ? OR a.title LIKE ? OR a.subject LIKE ? OR a.batch LIKE ? OR m.name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  if (TYPES.includes(type)) {
    clauses.push('a.type = ?');
    params.push(type);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${SELECT_SQL}${where} ORDER BY a.session_date DESC, a.id DESC`, params);
  res.json({ success: true, academics: rows.map(mapAcademic) });
});

export const getAcademic = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT_SQL} WHERE a.id = ? LIMIT 1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Academic record not found.' });
  res.json({ success: true, academic: mapAcademic(rows[0]) });
});

export const createAcademic = asyncHandler(async (req, res) => {
  const fields = academicFields(req.body);
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const code = await nextCode(pool);
  const keys = ['academic_code', ...Object.keys(fields)];
  const values = [code, ...Object.values(fields)];
  const [result] = await pool.query(
    `INSERT INTO academics (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    values
  );
  const [rows] = await pool.query(`${SELECT_SQL} WHERE a.id = ?`, [result.insertId]);
  res.status(201).json({ success: true, academic: mapAcademic(rows[0]) });
});

export const updateAcademic = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM academics WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Academic record not found.' });
  const fields = academicFields(req.body);
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const keys = Object.keys(fields);
  await pool.query(
    `UPDATE academics SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(fields), req.params.id]
  );
  const [rows] = await pool.query(`${SELECT_SQL} WHERE a.id = ?`, [req.params.id]);
  res.json({ success: true, academic: mapAcademic(rows[0]) });
});

export const deleteAcademic = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM academics WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Academic record not found.' });
  await pool.query('DELETE FROM academics WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Academic record deleted.' });
});
