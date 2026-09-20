import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const STATUSES = ['Present', 'Absent', 'Leave'];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function mapRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentCode: row.student_code || '',
    studentName: row.student_name || '',
    attendanceDate: row.attendance_date ? String(row.attendance_date).slice(0, 10) : '',
    status: row.status,
    batch: row.batch || '',
    remarks: row.remarks || ''
  };
}

const SELECT_SQL = `
  SELECT att.*, s.student_code, s.name AS student_name
  FROM attendance att
  INNER JOIN students s ON s.id = att.student_id
`;

async function refreshStudentAttendance(studentId) {
  await pool.query(
    `UPDATE students SET attendance = (
       SELECT COALESCE(ROUND(100 * SUM(status = 'Present') / COUNT(*)), 0)
       FROM attendance WHERE student_id = ?
     ) WHERE id = ?`,
    [studentId, studentId]
  );
}

export const listAttendance = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const date = String(req.query.date || '').trim();
  const status = String(req.query.status || '').trim();
  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('(s.student_code LIKE ? OR s.name LIKE ? OR att.batch LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (date) {
    clauses.push('att.attendance_date = ?');
    params.push(date);
  }
  if (STATUSES.includes(status)) {
    clauses.push('att.status = ?');
    params.push(status);
  }
  const batch = String(req.query.batch || '').trim();
  if (batch) {
    clauses.push('att.batch = ?');
    params.push(batch);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${SELECT_SQL}${where} ORDER BY att.attendance_date DESC, att.id DESC`, params);
  res.json({ success: true, attendance: rows.map(mapRow) });
});

export const getBatchAttendance = asyncHandler(async (req, res) => {
  const batch = String(req.query.batch || '').trim();
  const date = String(req.query.date || '').trim();
  if (!batch || !date) {
    return res.status(400).json({ success: false, error: 'Batch and date are required.' });
  }

  const [rows] = await pool.query(
    `SELECT s.id AS student_id, s.student_code, s.name AS student_name, s.batch,
            att.id AS attendance_id, att.status, att.remarks
     FROM students s
     LEFT JOIN attendance att ON att.student_id = s.id AND att.attendance_date = ?
     WHERE s.batch = ?
     ORDER BY s.name ASC`,
    [date, batch]
  );

  res.json({
    success: true,
    batch,
    attendanceDate: date,
    students: rows.map((row) => ({
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name,
      batch: row.batch || batch,
      attendanceId: row.attendance_id || null,
      status: STATUSES.includes(row.status) ? row.status : '',
      remarks: row.remarks || ''
    }))
  });
});

export const saveBatchAttendance = asyncHandler(async (req, res) => {
  const batch = String(req.body.batch || '').trim();
  const attendanceDate = emptyToNull(req.body.attendanceDate);
  const records = Array.isArray(req.body.records) ? req.body.records : [];

  if (!batch || !attendanceDate) {
    return res.status(400).json({ success: false, error: 'Batch and date are required.' });
  }
  if (!records.length) {
    return res.status(400).json({ success: false, error: 'Add at least one student record.' });
  }

  const [students] = await pool.query('SELECT id FROM students WHERE batch = ?', [batch]);
  const allowed = new Set(students.map((s) => Number(s.id)));
  if (!allowed.size) {
    return res.status(404).json({ success: false, error: 'No students found in this batch.' });
  }

  const conn = await pool.getConnection();
  const studentIds = [];
  try {
    await conn.beginTransaction();
    for (const rec of records) {
      const studentId = Number(rec.studentId);
      if (!allowed.has(studentId)) continue;
      const status = STATUSES.includes(rec.status) ? rec.status : 'Present';
      const remarks = emptyToNull(rec.remarks);
      await conn.query(
        `INSERT INTO attendance (student_id, attendance_date, status, batch, remarks)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), batch = VALUES(batch)`,
        [studentId, attendanceDate, status, batch, remarks]
      );
      studentIds.push(studentId);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  if (!studentIds.length) {
    return res.status(400).json({ success: false, error: 'None of the students belong to this batch.' });
  }

  for (const id of [...new Set(studentIds)]) {
    await refreshStudentAttendance(id);
  }

  const [rows] = await pool.query(
    `${SELECT_SQL} WHERE att.attendance_date = ? AND att.batch = ? ORDER BY s.name ASC`,
    [attendanceDate, batch]
  );
  res.json({ success: true, attendance: rows.map(mapRow) });
});

export const markOneAttendance = asyncHandler(async (req, res) => {
  const studentId = Number(req.body.studentId);
  const attendanceDate = emptyToNull(req.body.attendanceDate);
  const status = STATUSES.includes(req.body.status) ? req.body.status : 'Present';
  const remarks = emptyToNull(req.body.remarks);
  let batch = emptyToNull(req.body.batch);

  if (!studentId || !attendanceDate) {
    return res.status(400).json({ success: false, error: 'Student and date are required.' });
  }

  const [students] = await pool.query('SELECT id, batch FROM students WHERE id = ? LIMIT 1', [studentId]);
  if (!students.length) return res.status(404).json({ success: false, error: 'Student not found.' });
  if (!batch) batch = students[0].batch;

  await pool.query(
    `INSERT INTO attendance (student_id, attendance_date, status, batch, remarks)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), batch = VALUES(batch)`,
    [studentId, attendanceDate, status, batch, remarks]
  );
  await refreshStudentAttendance(studentId);
  const [rows] = await pool.query(
    `${SELECT_SQL} WHERE att.student_id = ? AND att.attendance_date = ? LIMIT 1`,
    [studentId, attendanceDate]
  );
  res.json({ success: true, record: mapRow(rows[0]) });
});

export const getAttendance = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT_SQL} WHERE att.id = ? LIMIT 1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Attendance record not found.' });
  res.json({ success: true, record: mapRow(rows[0]) });
});

export const createAttendance = asyncHandler(async (req, res) => {
  const studentId = Number(req.body.studentId);
  const attendanceDate = emptyToNull(req.body.attendanceDate);
  const status = STATUSES.includes(req.body.status) ? req.body.status : 'Present';
  const remarks = emptyToNull(req.body.remarks);
  let batch = emptyToNull(req.body.batch);

  if (!studentId || !attendanceDate) {
    return res.status(400).json({ success: false, error: 'Student and date are required.' });
  }

  const [students] = await pool.query('SELECT id, batch FROM students WHERE id = ? LIMIT 1', [studentId]);
  if (!students.length) return res.status(404).json({ success: false, error: 'Student not found.' });
  if (!batch) batch = students[0].batch;

  try {
    const [result] = await pool.query(
      'INSERT INTO attendance (student_id, attendance_date, status, batch, remarks) VALUES (?, ?, ?, ?, ?)',
      [studentId, attendanceDate, status, batch, remarks]
    );
    await refreshStudentAttendance(studentId);
    const [rows] = await pool.query(`${SELECT_SQL} WHERE att.id = ?`, [result.insertId]);
    res.status(201).json({ success: true, record: mapRow(rows[0]) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Attendance for this student on this date already exists. Edit that record instead.' });
    }
    throw err;
  }
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM attendance WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Attendance record not found.' });

  const studentId = Number(req.body.studentId) || existing[0].student_id;
  const attendanceDate = emptyToNull(req.body.attendanceDate) || existing[0].attendance_date;
  const status = STATUSES.includes(req.body.status) ? req.body.status : existing[0].status;
  const remarks = req.body.remarks === undefined ? existing[0].remarks : emptyToNull(req.body.remarks);
  const batch = req.body.batch === undefined ? existing[0].batch : emptyToNull(req.body.batch);

  try {
    await pool.query(
      'UPDATE attendance SET student_id = ?, attendance_date = ?, status = ?, batch = ?, remarks = ? WHERE id = ?',
      [studentId, attendanceDate, status, batch, remarks, req.params.id]
    );
    await refreshStudentAttendance(studentId);
    if (Number(existing[0].student_id) !== Number(studentId)) {
      await refreshStudentAttendance(existing[0].student_id);
    }
    const [rows] = await pool.query(`${SELECT_SQL} WHERE att.id = ?`, [req.params.id]);
    res.json({ success: true, record: mapRow(rows[0]) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Attendance for this student on this date already exists.' });
    }
    throw err;
  }
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT student_id FROM attendance WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Attendance record not found.' });
  await pool.query('DELETE FROM attendance WHERE id = ?', [req.params.id]);
  await refreshStudentAttendance(existing[0].student_id);
  res.json({ success: true, message: 'Attendance record deleted.' });
});
