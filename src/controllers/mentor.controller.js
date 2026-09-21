import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { cleanupTempFiles, saveMentorFiles } from '../middleware/upload.js';
import { deletePortalUser, upsertPortalUser } from '../services/portalUser.js';

const STATUSES = ['Active', 'Inactive'];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapMentor(row) {
  return {
    id: row.id,
    mentorCode: row.mentor_code,
    userId: row.user_id,
    name: row.name,
    photo: row.photo || '',
    designation: row.designation || '',
    subject: row.subject || '',
    experience: toNumber(row.experience),
    expertise: row.expertise || '',
    bio: row.bio || '',
    examCategory: row.exam_category || '',
    qualification: row.qualification || '',
    phone: row.phone || '',
    email: row.email || '',
    gender: row.gender || '',
    status: row.status,
    updatedAt: row.updated_at || ''
  };
}

export { mapMentor };

function duplicateError(err, next) {
  if (err?.code === 'ER_DUP_ENTRY') {
    err.status = 409;
    if (String(err.sqlMessage || '').includes('username')) {
      err.message = 'That username is already taken.';
    } else if (String(err.sqlMessage || '').includes('email')) {
      err.message = 'A mentor with this email already exists.';
    } else if (String(err.sqlMessage || '').includes('mentor_code')) {
      err.message = 'A mentor with this ID already exists.';
    } else {
      err.message = 'This record already exists.';
    }
  }
  next(err);
}

function mentorFields(body) {
  return {
    name: String(body.name || '').trim(),
    designation: emptyToNull(body.designation),
    subject: emptyToNull(body.subject),
    experience: Math.max(0, toNumber(body.experience)),
    expertise: emptyToNull(body.expertise),
    bio: emptyToNull(body.bio),
    exam_category: emptyToNull(body.examCategory),
    qualification: emptyToNull(body.qualification),
    phone: emptyToNull(body.phone),
    email: emptyToNull(body.email),
    gender: emptyToNull(body.gender),
    status: STATUSES.includes(body.status) ? body.status : 'Active'
  };
}

function validateMentor(fields) {
  if (!fields.name || fields.name.length < 2) return 'Mentor name is required.';
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return 'Enter a valid email address.';
  }
  return null;
}

async function nextMentorCode(conn) {
  const [rows] = await conn.query(
    "SELECT mentor_code FROM mentors WHERE mentor_code LIKE 'MEN%' ORDER BY CAST(SUBSTRING(mentor_code, 4) AS UNSIGNED) DESC LIMIT 1"
  );
  if (!rows.length) return 'MEN001';
  const current = Number(String(rows[0].mentor_code).replace(/\D/g, '')) || 0;
  return `MEN${String(current + 1).padStart(3, '0')}`;
}

async function findMentor(id) {
  const isNumeric = /^\d+$/.test(String(id));
  const [rows] = await pool.query(
    `SELECT * FROM mentors WHERE ${isNumeric ? 'id = ?' : 'mentor_code = ?'} LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function insertMentor(conn, data) {
  const keys = Object.keys(data);
  const [result] = await conn.query(
    `INSERT INTO mentors (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  return result.insertId;
}

async function updateMentorRow(id, data, conn = pool) {
  const keys = Object.keys(data);
  await conn.query(
    `UPDATE mentors SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(data), id]
  );
}

export const getMyMentor = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM mentors WHERE user_id = ? LIMIT 1', [req.user.id]);
  if (!rows.length) {
    return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  }
  res.json({ success: true, mentor: mapMentor(rows[0]) });
});

export const updateMyMentor = asyncHandler(async (req, res, next) => {
  const [rows] = await pool.query('SELECT * FROM mentors WHERE user_id = ? LIMIT 1', [req.user.id]);
  if (!rows.length) {
    cleanupTempFiles(req.files);
    return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  }

  const existing = rows[0];
  const mapped = mapMentor(existing);
  const fields = mentorFields({
    ...mapped,
    ...req.body,
    status: mapped.status
  });
  fields.status = existing.status;

  const error = validateMentor(fields);
  if (error) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error });
  }

  try {
    const filePaths = saveMentorFiles(req.files, existing.mentor_code);
    await updateMentorRow(existing.id, { ...fields, ...filePaths, user_id: existing.user_id });
    const [updated] = await pool.query('SELECT * FROM mentors WHERE id = ?', [existing.id]);
    res.json({ success: true, mentor: mapMentor(updated[0]) });
  } catch (err) {
    cleanupTempFiles(req.files);
    duplicateError(err, next);
  }
});

export const listMentors = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  let sql = 'SELECT * FROM mentors';
  const params = [];
  if (search) {
    sql += ' WHERE mentor_code LIKE ? OR name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR designation LIKE ?';
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }
  sql += ' ORDER BY id DESC';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, mentors: rows.map(mapMentor) });
});

export const listPublicMentors = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM mentors WHERE status = 'Active' ORDER BY id DESC"
  );
  res.json({ success: true, mentors: rows.map(mapMentor) });
});

export const getMentor = asyncHandler(async (req, res) => {
  const mentor = await findMentor(req.params.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'Mentor not found.' });
  res.json({ success: true, mentor: mapMentor(mentor) });
});

export const createMentor = asyncHandler(async (req, res, next) => {
  const fields = mentorFields(req.body);
  const error = validateMentor(fields);
  if (error) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error });
  }

  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const mentorCode = emptyToNull(req.body.mentorCode) || (await nextMentorCode(conn));

    const { userId } = await upsertPortalUser(conn, {
      username,
      password,
      roleName: 'staff',
      existingUserId: null
    });

    const filePaths = saveMentorFiles(req.files, mentorCode);
    const insertId = await insertMentor(conn, {
      mentor_code: mentorCode,
      user_id: userId,
      ...fields,
      ...filePaths
    });

    await conn.commit();
    const [rows] = await conn.query('SELECT * FROM mentors WHERE id = ?', [insertId]);
    res.status(201).json({ success: true, mentor: mapMentor(rows[0]) });
  } catch (err) {
    await conn.rollback();
    cleanupTempFiles(req.files);
    if (err.status === 400 || err.status === 500) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    duplicateError(err, next);
  } finally {
    conn.release();
  }
});

export const updateMentor = asyncHandler(async (req, res, next) => {
  const existing = await findMentor(req.params.id);
  if (!existing) {
    cleanupTempFiles(req.files);
    return res.status(404).json({ success: false, error: 'Mentor not found.' });
  }

  const fields = mentorFields({ ...mapMentor(existing), ...req.body });
  const error = validateMentor(fields);
  if (error) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error });
  }

  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { userId } = await upsertPortalUser(conn, {
      username,
      password,
      roleName: 'staff',
      existingUserId: existing.user_id || null
    });

    const filePaths = saveMentorFiles(req.files, existing.mentor_code);
    await updateMentorRow(existing.id, { ...fields, ...filePaths, user_id: userId }, conn);

    await conn.commit();
    const [rows] = await conn.query('SELECT * FROM mentors WHERE id = ?', [existing.id]);
    res.json({ success: true, mentor: mapMentor(rows[0]) });
  } catch (err) {
    await conn.rollback();
    cleanupTempFiles(req.files);
    if (err.status === 400 || err.status === 500) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    duplicateError(err, next);
  } finally {
    conn.release();
  }
});

export const deleteMentor = asyncHandler(async (req, res, next) => {
  const existing = await findMentor(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Mentor not found.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM mentors WHERE id = ?', [existing.id]);
    if (existing.user_id) {
      await deletePortalUser(conn, existing.user_id);
    }
    await conn.commit();
    res.json({ success: true, message: 'Mentor deleted.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});
