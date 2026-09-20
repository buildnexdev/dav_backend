import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { cleanupTempFiles, saveAlumniFiles } from '../middleware/upload.js';
import { nextCode } from '../db/codes.js';

const STATUSES = ['Active', 'Inactive'];
const SERVICES = ['IAS', 'IPS', 'IFS', 'IRS', 'IFoS', 'CAPF', 'TNPSC', 'SSC', 'Other'];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapAlumni(row) {
  return {
    id: row.id,
    alumniCode: row.alumni_code,
    name: row.name,
    photo: row.photo || '',
    year: row.year || '',
    air: row.air || '',
    service: row.service || '',
    cadre: row.cadre || '',
    optionalSubject: row.optional_subject || '',
    currentDesignation: row.current_designation || '',
    currentPosting: row.current_posting || '',
    testimonial: row.testimonial || '',
    status: row.status,
    updatedAt: row.updated_at || ''
  };
}

function alumniFields(body) {
  return {
    name: String(body.name || '').trim(),
    year: toNumber(body.year),
    air: toNumber(body.air),
    service: emptyToNull(body.service),
    cadre: emptyToNull(body.cadre),
    optional_subject: emptyToNull(body.optionalSubject),
    current_designation: emptyToNull(body.currentDesignation),
    current_posting: emptyToNull(body.currentPosting),
    testimonial: emptyToNull(body.testimonial),
    status: STATUSES.includes(body.status) ? body.status : 'Active'
  };
}

async function findAlumni(id) {
  const isNumeric = /^\d+$/.test(String(id));
  const [rows] = await pool.query(
    `SELECT * FROM alumni WHERE ${isNumeric ? 'id = ?' : 'alumni_code = ?'} LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export const listAlumni = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('(alumni_code LIKE ? OR name LIKE ? OR service LIKE ? OR cadre LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (STATUSES.includes(status)) {
    clauses.push('status = ?');
    params.push(status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM alumni${where} ORDER BY year DESC, id DESC`, params);
  res.json({ success: true, alumni: rows.map(mapAlumni) });
});

export const listPublicAlumni = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM alumni WHERE status = 'Active' ORDER BY year DESC, id DESC");
  res.json({ success: true, alumni: rows.map(mapAlumni) });
});

export const getAlumni = asyncHandler(async (req, res) => {
  const row = await findAlumni(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Alumni record not found.' });
  res.json({ success: true, alumni: mapAlumni(row) });
});

export const createAlumni = asyncHandler(async (req, res) => {
  const fields = alumniFields(req.body);
  if (!fields.name) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error: 'Alumni name is required.' });
  }
  const code = await nextCode(pool, 'alumni', 'alumni_code', 'ALM');
  const filePaths = saveAlumniFiles(req.files, code);
  const data = { alumni_code: code, ...fields, ...filePaths };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO alumni (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM alumni WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, alumni: mapAlumni(rows[0]) });
});

export const updateAlumni = asyncHandler(async (req, res) => {
  const existing = await findAlumni(req.params.id);
  if (!existing) {
    cleanupTempFiles(req.files);
    return res.status(404).json({ success: false, error: 'Alumni record not found.' });
  }
  const fields = alumniFields({ ...mapAlumni(existing), ...req.body });
  if (!fields.name) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error: 'Alumni name is required.' });
  }
  const filePaths = saveAlumniFiles(req.files, existing.alumni_code);
  const data = { ...fields, ...filePaths };
  const keys = Object.keys(data);
  await pool.query(
    `UPDATE alumni SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(data), existing.id]
  );
  const [rows] = await pool.query('SELECT * FROM alumni WHERE id = ?', [existing.id]);
  res.json({ success: true, alumni: mapAlumni(rows[0]) });
});

export const setAlumniStatus = asyncHandler(async (req, res) => {
  const existing = await findAlumni(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Alumni record not found.' });
  const status = STATUSES.includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  await pool.query('UPDATE alumni SET status = ? WHERE id = ?', [status, existing.id]);
  const [rows] = await pool.query('SELECT * FROM alumni WHERE id = ?', [existing.id]);
  res.json({ success: true, alumni: mapAlumni(rows[0]) });
});

export const deleteAlumni = asyncHandler(async (req, res) => {
  const existing = await findAlumni(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Alumni record not found.' });
  await pool.query('DELETE FROM alumni WHERE id = ?', [existing.id]);
  res.json({ success: true, message: 'Alumni record deleted.' });
});

export { SERVICES };
