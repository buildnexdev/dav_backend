import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextCode } from '../db/codes.js';

export const APPLICATION_STATUSES = [
  'Submitted',
  'Under Review',
  'Documents Verified',
  'Exam Scheduled',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected'
];

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

export function mapApplication(row) {
  return {
    id: row.id,
    applicationCode: row.application_code,
    name: row.name,
    dob: row.dob ? String(row.dob).slice(0, 10) : '',
    gender: row.gender || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    district: row.district || '',
    state: row.state || '',
    tenth: row.tenth == null ? '' : Number(row.tenth),
    twelfth: row.twelfth == null ? '' : Number(row.twelfth),
    degree: row.degree || '',
    university: row.university || '',
    percentage: row.percentage == null ? '' : Number(row.percentage),
    gradYear: row.grad_year || '',
    program: row.program || '',
    paymentId: row.payment_id || '',
    status: row.status,
    remarks: row.remarks || '',
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : ''
  };
}

function applicationFields(body) {
  return {
    name: String(body.name || body.fullName || '').trim(),
    dob: emptyToNull(body.dob),
    gender: emptyToNull(body.gender),
    phone: emptyToNull(body.phone || body.mobile),
    email: emptyToNull(body.email),
    address: emptyToNull(body.address),
    district: emptyToNull(body.district),
    state: emptyToNull(body.state),
    tenth: toNumber(body.tenth),
    twelfth: toNumber(body.twelfth),
    degree: emptyToNull(body.degree),
    university: emptyToNull(body.university),
    percentage: toNumber(body.percentage),
    grad_year: toNumber(body.gradYear),
    program: emptyToNull(body.program || body.exam),
    payment_id: body.paymentId ? Number(body.paymentId) || null : null,
    status: APPLICATION_STATUSES.includes(body.status) ? body.status : 'Submitted',
    remarks: emptyToNull(body.remarks)
  };
}

export const listApplications = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const clauses = [];
  const params = [];
  if (search) {
    const like = `%${search}%`;
    clauses.push('(application_code LIKE ? OR name LIKE ? OR email LIKE ? OR phone LIKE ? OR program LIKE ?)');
    params.push(like, like, like, like, like);
  }
  if (APPLICATION_STATUSES.includes(status)) {
    clauses.push('status = ?');
    params.push(status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM applications${where} ORDER BY id DESC`, params);
  const [[stats]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status IN ('Submitted','Under Review')) AS pending,
      SUM(status = 'Selected') AS selected,
      SUM(status = 'Rejected') AS rejected
    FROM applications
  `);
  res.json({
    success: true,
    applications: rows.map(mapApplication),
    stats: {
      total: Number(stats.total) || 0,
      pending: Number(stats.pending) || 0,
      selected: Number(stats.selected) || 0,
      rejected: Number(stats.rejected) || 0
    },
    statuses: APPLICATION_STATUSES
  });
});

export const getApplication = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM applications WHERE id = ? OR application_code = ? LIMIT 1', [req.params.id, req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Application not found.' });
  res.json({ success: true, application: mapApplication(rows[0]) });
});

export const createApplication = asyncHandler(async (req, res) => {
  const fields = applicationFields(req.body);
  if (!fields.name || fields.name.length < 2) {
    return res.status(400).json({ success: false, error: 'Applicant name is required.' });
  }
  if (!fields.program) {
    return res.status(400).json({ success: false, error: 'Target examination is required.' });
  }
  const code = await nextCode(pool, 'applications', 'application_code', 'APP');
  const data = { application_code: code, ...fields };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO applications (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM applications WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, application: mapApplication(rows[0]) });
});

export const updateApplication = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM applications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Application not found.' });
  const fields = applicationFields({ ...mapApplication(existing[0]), ...req.body });
  if (!fields.name) return res.status(400).json({ success: false, error: 'Applicant name is required.' });
  const keys = Object.keys(fields);
  await pool.query(
    `UPDATE applications SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(fields), req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  res.json({ success: true, application: mapApplication(rows[0]) });
});

export const setApplicationStatus = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM applications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Application not found.' });
  const status = APPLICATION_STATUSES.includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: 'Choose a valid application status.' });
  const remarks = emptyToNull(req.body.remarks);
  await pool.query('UPDATE applications SET status = ?, remarks = COALESCE(?, remarks) WHERE id = ?', [status, remarks, req.params.id]);
  const [rows] = await pool.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  res.json({ success: true, application: mapApplication(rows[0]) });
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM applications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Application not found.' });
  await pool.query('DELETE FROM applications WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Application deleted.' });
});

export const trackApplication = asyncHandler(async (req, res) => {
  const code = String(req.query.code || req.query.applicationCode || '').trim();
  const lookup = String(req.query.lookup || req.query.dob || req.query.phone || '').trim();
  if (!code) {
    return res.status(400).json({ success: false, error: 'Application number is required.' });
  }
  const clauses = ['application_code = ?'];
  const params = [code];
  if (lookup) {
    clauses.push('(phone = ? OR dob = ? OR email = ?)');
    params.push(lookup, lookup, lookup);
  }
  const [rows] = await pool.query(
    `SELECT * FROM applications WHERE ${clauses.join(' AND ')} LIMIT 1`,
    params
  );
  if (!rows.length) {
    return res.status(404).json({ success: false, error: 'No application found for those details.' });
  }
  res.json({ success: true, application: mapApplication(rows[0]), statuses: APPLICATION_STATUSES });
});
