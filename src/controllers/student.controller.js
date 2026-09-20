import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { cleanupTempFiles, saveStudentFiles } from '../middleware/upload.js';

const STATUSES = ['Active', 'Inactive', 'Graduated'];

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function toFlag(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'on' ? 1 : 0;
}

function mapStudent(row) {
  return {
    id: row.id,
    studentCode: row.student_code,
    userId: row.user_id,
    name: row.name,
    program: row.program || '',
    batch: row.batch || '',
    phone: row.phone || '',
    email: row.email || '',
    attendance: toNumber(row.attendance),
    performance: toNumber(row.performance),
    scholarship: row.scholarship || 'None',
    status: row.status,
    gender: row.gender || '',
    dob: row.dob || '',
    address: row.address || '',
    addressLine2: row.address_line2 || '',
    state: row.state || '',
    district: row.district || '',
    city: row.city || row.district || '',
    country: row.country || 'India',
    pincode: row.pincode || '',
    tenth: row.tenth === null || row.tenth === undefined ? '' : toNumber(row.tenth),
    twelfth: row.twelfth === null || row.twelfth === undefined ? '' : toNumber(row.twelfth),
    degree: row.degree || '',
    university: row.university || '',
    gradYear: row.grad_year === null || row.grad_year === undefined ? '' : row.grad_year,
    hostel: row.hostel || '',
    room: row.room || '',
    nationality: row.nationality || 'Indian',
    religion: row.religion || '',
    community: row.community || '',
    motherTongue: row.mother_tongue || '',
    aadhaarNumber: row.aadhaar_number || '',
    birthCertificate: row.birth_certificate || '',
    photograph: row.photograph || '',
    fatherName: row.father_name || '',
    motherName: row.mother_name || '',
    fatherQualification: row.father_qualification || '',
    motherQualification: row.mother_qualification || '',
    fatherQualificationProof: row.father_qualification_proof || '',
    motherQualificationProof: row.mother_qualification_proof || '',
    fatherOccupation: row.father_occupation || '',
    motherOccupation: row.mother_occupation || '',
    fatherOccupationProof: row.father_occupation_proof || '',
    motherOccupationProof: row.mother_occupation_proof || '',
    annualIncome: row.annual_income || '',
    incomeCertificate: row.income_certificate || '',
    alternatePhone: row.alternate_phone || '',
    alternateEmail: row.alternate_email || '',
    addressProof: row.address_proof || '',
    flagSingleParent: Boolean(row.flag_single_parent),
    flagDefenceCivil: Boolean(row.flag_defence_civil),
    flagDifferentlyAbled: Boolean(row.flag_differently_abled),
    flagSpecialChild: Boolean(row.flag_special_child),
    flagGuardianship: Boolean(row.flag_guardianship),
    flagSportsArts: Boolean(row.flag_sports_arts),
    flagParentAlumni: Boolean(row.flag_parent_alumni),
    flagOneChildSibling: Boolean(row.flag_one_child_sibling),
    flagTwoChildren: Boolean(row.flag_two_children),
    flagTwins: Boolean(row.flag_twins),
    otherDetails: row.other_details || '',
    otherDocuments: row.other_documents || '',
    updatedAt: row.updated_at || ''
  };
}

function duplicateError(err, next) {
  if (err?.code === 'ER_DUP_ENTRY') {
    err.status = 409;
    if (String(err.sqlMessage || '').includes('username')) {
      err.message = 'That username is already taken.';
    } else if (String(err.sqlMessage || '').includes('email')) {
      err.message = 'A student with this email already exists.';
    } else if (String(err.sqlMessage || '').includes('student_code')) {
      err.message = 'A student with this ID already exists.';
    } else {
      err.message = 'This record already exists.';
    }
  }
  next(err);
}

function studentFields(body) {
  const status = STATUSES.includes(body.status) ? body.status : 'Active';
  const city = emptyToNull(body.city) || emptyToNull(body.district);
  return {
    name: String(body.name || '').trim(),
    program: emptyToNull(body.program),
    batch: emptyToNull(body.batch),
    phone: emptyToNull(body.phone),
    email: emptyToNull(body.email),
    attendance: Math.min(100, Math.max(0, toNumber(body.attendance))),
    performance: Math.min(100, Math.max(0, toNumber(body.performance))),
    scholarship: emptyToNull(body.scholarship) || 'None',
    status,
    gender: emptyToNull(body.gender),
    dob: emptyToNull(body.dob),
    address: emptyToNull(body.address) || emptyToNull(body.addressLine1),
    address_line2: emptyToNull(body.addressLine2),
    state: emptyToNull(body.state),
    district: city,
    city,
    country: emptyToNull(body.country) || 'India',
    pincode: emptyToNull(body.pincode),
    tenth: body.tenth === '' || body.tenth === undefined ? null : toNumber(body.tenth, null),
    twelfth: body.twelfth === '' || body.twelfth === undefined ? null : toNumber(body.twelfth, null),
    degree: emptyToNull(body.degree),
    university: emptyToNull(body.university),
    grad_year: body.gradYear === '' || body.gradYear === undefined ? null : toNumber(body.gradYear, null),
    hostel: emptyToNull(body.hostel),
    room: emptyToNull(body.room),
    nationality: emptyToNull(body.nationality) || 'Indian',
    religion: emptyToNull(body.religion),
    community: emptyToNull(body.community),
    mother_tongue: emptyToNull(body.motherTongue),
    aadhaar_number: emptyToNull(body.aadhaarNumber),
    father_name: emptyToNull(body.fatherName),
    mother_name: emptyToNull(body.motherName),
    father_qualification: emptyToNull(body.fatherQualification),
    mother_qualification: emptyToNull(body.motherQualification),
    father_occupation: emptyToNull(body.fatherOccupation),
    mother_occupation: emptyToNull(body.motherOccupation),
    annual_income: emptyToNull(body.annualIncome),
    alternate_phone: emptyToNull(body.alternatePhone),
    alternate_email: emptyToNull(body.alternateEmail),
    flag_single_parent: toFlag(body.flagSingleParent),
    flag_defence_civil: toFlag(body.flagDefenceCivil),
    flag_differently_abled: toFlag(body.flagDifferentlyAbled),
    flag_special_child: toFlag(body.flagSpecialChild),
    flag_guardianship: toFlag(body.flagGuardianship),
    flag_sports_arts: toFlag(body.flagSportsArts),
    flag_parent_alumni: toFlag(body.flagParentAlumni),
    flag_one_child_sibling: toFlag(body.flagOneChildSibling),
    flag_two_children: toFlag(body.flagTwoChildren),
    flag_twins: toFlag(body.flagTwins),
    other_details: emptyToNull(body.otherDetails)
  };
}

function validateStudent(fields) {
  if (!fields.name || fields.name.length < 2) {
    return 'Name of the student is required.';
  }
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return 'Enter a valid primary email ID.';
  }
  if (fields.alternate_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.alternate_email)) {
    return 'Enter a valid alternate email ID.';
  }
  return null;
}

async function nextStudentCode(conn) {
  const [rows] = await conn.query(
    "SELECT student_code FROM students WHERE student_code LIKE 'STU%' ORDER BY CAST(SUBSTRING(student_code, 4) AS UNSIGNED) DESC LIMIT 1"
  );
  if (!rows.length) return 'STU001';
  const current = Number(String(rows[0].student_code).replace(/\D/g, '')) || 0;
  return `STU${String(current + 1).padStart(3, '0')}`;
}

async function findStudent(id) {
  const isNumeric = /^\d+$/.test(String(id));
  const [rows] = await pool.query(
    `SELECT * FROM students WHERE ${isNumeric ? 'id = ?' : 'student_code = ?'} LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function insertStudent(conn, data) {
  const keys = Object.keys(data);
  const [result] = await conn.query(
    `INSERT INTO students (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  return result.insertId;
}

async function updateStudentRow(id, data) {
  const keys = Object.keys(data);
  await pool.query(
    `UPDATE students SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(data), id]
  );
}

export const listStudents = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  let sql = 'SELECT * FROM students';
  const params = [];

  if (search) {
    sql += ` WHERE student_code LIKE ? OR name LIKE ? OR email LIKE ? OR phone LIKE ?
      OR program LIKE ? OR batch LIKE ? OR father_name LIKE ? OR aadhaar_number LIKE ?`;
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like, like, like);
  }

  sql += ' ORDER BY id DESC';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, students: rows.map(mapStudent) });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await findStudent(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Student not found.' });
  }
  res.json({ success: true, student: mapStudent(student) });
});

export const getMyStudent = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
  if (!rows.length) {
    return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  }
  res.json({ success: true, student: mapStudent(rows[0]) });
});

export const createStudent = asyncHandler(async (req, res, next) => {
  const fields = studentFields(req.body);
  const error = validateStudent(fields);
  if (error) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error });
  }

  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (username && !password) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error: 'Password is required when creating a student login.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const studentCode = emptyToNull(req.body.studentCode) || (await nextStudentCode(conn));
    let userId = null;

    if (username) {
      const passwordHash = await bcrypt.hash(password, 10);
      const [roleRows] = await conn.query("SELECT id FROM roles WHERE name = 'student' LIMIT 1");
      const [userResult] = await conn.query(
        'INSERT INTO users (username, password_hash, role_id, is_active) VALUES (?, ?, ?, 1)',
        [username, passwordHash, roleRows[0].id]
      );
      userId = userResult.insertId;
    }

    const filePaths = saveStudentFiles(req.files, studentCode);
    const insertId = await insertStudent(conn, {
      student_code: studentCode,
      user_id: userId,
      ...fields,
      ...filePaths
    });

    await conn.commit();
    const [rows] = await conn.query('SELECT * FROM students WHERE id = ?', [insertId]);
    res.status(201).json({ success: true, student: mapStudent(rows[0]) });
  } catch (err) {
    await conn.rollback();
    cleanupTempFiles(req.files);
    duplicateError(err, next);
  } finally {
    conn.release();
  }
});

export const updateStudent = asyncHandler(async (req, res, next) => {
  const existing = await findStudent(req.params.id);
  if (!existing) {
    cleanupTempFiles(req.files);
    return res.status(404).json({ success: false, error: 'Student not found.' });
  }

  const fields = studentFields({ ...mapStudent(existing), ...req.body });
  const error = validateStudent(fields);
  if (error) {
    cleanupTempFiles(req.files);
    return res.status(400).json({ success: false, error });
  }

  try {
    const filePaths = saveStudentFiles(req.files, existing.student_code, existing);
    await updateStudentRow(existing.id, { ...fields, ...filePaths });
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [existing.id]);
    res.json({ success: true, student: mapStudent(rows[0]) });
  } catch (err) {
    cleanupTempFiles(req.files);
    duplicateError(err, next);
  }
});

export const updateMyStudent = asyncHandler(async (req, res, next) => {
  const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
  if (!rows.length) {
    cleanupTempFiles(req.files);
    return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  }
  req.params.id = String(rows[0].id);
  return updateStudent(req, res, next);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const existing = await findStudent(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Student not found.' });
  }

  await pool.query('DELETE FROM students WHERE id = ?', [existing.id]);
  res.json({ success: true, message: 'Student deleted.' });
});
