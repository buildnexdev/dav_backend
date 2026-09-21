import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextCode } from '../db/codes.js';
import { uploadsRoot } from '../config/paths.js';
import { mapNews } from './news.controller.js';
import { mapNotification } from './notification.controller.js';

async function getLinkedStudent(userId) {
  const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
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
    mentorName: row.mentor_name || '',
    sessionDate: row.session_date ? String(row.session_date).slice(0, 10) : '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    venue: row.venue || '',
    description: row.description || '',
    status: row.status
  };
}

function mapAttendance(row) {
  return {
    id: row.id,
    attendanceDate: row.attendance_date ? String(row.attendance_date).slice(0, 10) : '',
    status: row.status,
    batch: row.batch || '',
    remarks: row.remarks || ''
  };
}

function mapMaterial(row) {
  return {
    id: row.id,
    materialCode: row.material_code,
    title: row.title,
    subject: row.subject || '',
    program: row.program || '',
    batch: row.batch || '',
    description: row.description || '',
    filePath: row.file_path || '',
    externalUrl: row.external_url || '',
    status: row.status,
    updatedAt: row.updated_at || ''
  };
}

function mapResult(row) {
  return {
    id: row.id,
    resultCode: row.result_code,
    title: row.title,
    subject: row.subject || '',
    examDate: row.exam_date ? String(row.exam_date).slice(0, 10) : '',
    marks: row.marks === null || row.marks === undefined ? null : Number(row.marks),
    maxMarks: row.max_marks === null || row.max_marks === undefined ? 100 : Number(row.max_marks),
    percentage: row.percentage === null || row.percentage === undefined ? null : Number(row.percentage),
    rankNo: row.rank_no === null || row.rank_no === undefined ? null : Number(row.rank_no),
    remarks: row.remarks || ''
  };
}

function mapSubmission(row) {
  return {
    id: row.id,
    submissionCode: row.submission_code,
    academicId: row.academic_id,
    content: row.content || '',
    filePath: row.file_path || '',
    status: row.status,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    feedback: row.feedback || '',
    submittedAt: row.submitted_at || ''
  };
}

async function listAcademicsForStudent(student, types) {
  const clauses = ['a.status <> ?'];
  const params = ['Cancelled'];
  if (types?.length) {
    clauses.push(`a.type IN (${types.map(() => '?').join(',')})`);
    params.push(...types);
  }
  if (student.batch) {
    clauses.push('(a.batch IS NULL OR a.batch = \'\' OR a.batch = ?)');
    params.push(student.batch);
  }
  if (student.program) {
    clauses.push('(a.program IS NULL OR a.program = \'\' OR a.program = ?)');
    params.push(student.program);
  }
  const [rows] = await pool.query(
    `SELECT a.*, m.name AS mentor_name
     FROM academics a
     LEFT JOIN mentors m ON m.id = a.mentor_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY a.session_date ASC, a.start_time ASC, a.id DESC`,
    params
  );
  return rows.map(mapAcademic);
}

export const myTimetable = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  const academics = await listAcademicsForStudent(student, ['Class', 'Schedule', 'Mentorship']);
  res.json({ success: true, academics, student: { batch: student.batch || '', program: student.program || '' } });
});

export const myTests = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  const academics = await listAcademicsForStudent(student, ['Test']);
  res.json({ success: true, academics });
});

export const myAssignments = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  const academics = await listAcademicsForStudent(student, ['Assignment']);
  const ids = academics.map((a) => a.id);
  let submissions = [];
  if (ids.length) {
    const [rows] = await pool.query(
      `SELECT * FROM assignment_submissions WHERE student_id = ? AND academic_id IN (${ids.map(() => '?').join(',')})`,
      [student.id, ...ids]
    );
    submissions = rows.map(mapSubmission);
  }
  res.json({
    success: true,
    assignments: academics.map((a) => ({
      ...a,
      submission: submissions.find((s) => s.academicId === a.id) || null
    }))
  });
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  }

  const academicId = Number(req.params.id);
  const content = String(req.body.content || '').trim();
  const [academicRows] = await pool.query(
    "SELECT * FROM academics WHERE id = ? AND type = 'Assignment' LIMIT 1",
    [academicId]
  );
  if (!academicRows.length) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, error: 'Assignment not found.' });
  }

  let filePath = null;
  if (req.file) {
    const dir = path.join(uploadsRoot, 'submissions', String(student.student_code || student.id));
    fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(req.file.originalname || '') || '.pdf';
    const filename = `assignment-${academicId}-${Date.now()}${ext}`;
    const dest = path.join(dir, filename);
    fs.renameSync(req.file.path, dest);
    filePath = `/uploads/submissions/${student.student_code || student.id}/${filename}`;
  }

  if (!content && !filePath) {
    return res.status(400).json({ success: false, error: 'Add written content or upload a file to submit.' });
  }

  const [existing] = await pool.query(
    'SELECT * FROM assignment_submissions WHERE academic_id = ? AND student_id = ? LIMIT 1',
    [academicId, student.id]
  );

  if (existing.length) {
    const updates = ['content = ?', 'status = ?'];
    const params = [content || existing[0].content, 'Submitted'];
    if (filePath) {
      updates.push('file_path = ?');
      params.push(filePath);
    }
    params.push(existing[0].id);
    await pool.query(`UPDATE assignment_submissions SET ${updates.join(', ')} WHERE id = ?`, params);
    const [rows] = await pool.query('SELECT * FROM assignment_submissions WHERE id = ?', [existing[0].id]);
    return res.json({ success: true, submission: mapSubmission(rows[0]) });
  }

  const code = await nextCode(pool, 'assignment_submissions', 'submission_code', 'SUB');
  const [result] = await pool.query(
    `INSERT INTO assignment_submissions
      (submission_code, academic_id, student_id, content, file_path, status)
     VALUES (?, ?, ?, ?, ?, 'Submitted')`,
    [code, academicId, student.id, content || null, filePath]
  );
  const [rows] = await pool.query('SELECT * FROM assignment_submissions WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, submission: mapSubmission(rows[0]) });
});

export const myAttendance = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });

  const [rows] = await pool.query(
    'SELECT * FROM attendance WHERE student_id = ? ORDER BY attendance_date DESC, id DESC',
    [student.id]
  );
  const attendance = rows.map(mapAttendance);
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === 'Present').length;
  const absent = attendance.filter((a) => a.status === 'Absent').length;
  const leave = attendance.filter((a) => a.status === 'Leave').length;

  res.json({
    success: true,
    summary: {
      percentage: Number(student.attendance) || (total ? Math.round((100 * present) / total) : 0),
      total,
      present,
      absent,
      leave
    },
    attendance
  });
});

export const myAnnouncements = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM notifications WHERE status = 'Active' ORDER BY published_date DESC, id DESC"
  );
  res.json({ success: true, notifications: rows.map(mapNotification) });
});

export const myScholarship = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  res.json({
    success: true,
    scholarship: {
      studentCode: student.student_code,
      name: student.name,
      program: student.program || '',
      batch: student.batch || '',
      scholarship: student.scholarship || 'None',
      status: student.status,
      annualIncome: student.annual_income || ''
    }
  });
});

export const myMaterials = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });

  const clauses = ["status = 'Active'"];
  const params = [];
  if (student.batch) {
    clauses.push('(batch IS NULL OR batch = \'\' OR batch = ?)');
    params.push(student.batch);
  }
  if (student.program) {
    clauses.push('(program IS NULL OR program = \'\' OR program = ?)');
    params.push(student.program);
  }
  const [rows] = await pool.query(
    `SELECT * FROM study_materials WHERE ${clauses.join(' AND ')} ORDER BY id DESC`,
    params
  );
  res.json({ success: true, materials: rows.map(mapMaterial) });
});

export const myResults = asyncHandler(async (req, res) => {
  const student = await getLinkedStudent(req.user.id);
  if (!student) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  const [rows] = await pool.query(
    'SELECT * FROM test_results WHERE student_id = ? ORDER BY exam_date DESC, id DESC',
    [student.id]
  );
  res.json({
    success: true,
    performance: Number(student.performance) || 0,
    results: rows.map(mapResult)
  });
});

export const myCurrentAffairs = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM news
     WHERE status = 'Active'
       AND (
         category IS NULL OR category = '' OR
         category LIKE '%Current%' OR category LIKE '%Affairs%' OR
         category IN ('Government Schemes','Exam Updates','Latest Notifications')
       )
     ORDER BY published_date DESC, id DESC`
  );
  res.json({ success: true, items: rows.map(mapNews) });
});

/* ── Admin CRUD for materials & results ── */

export const listMaterialsAdmin = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  let sql = 'SELECT * FROM study_materials';
  const params = [];
  if (search) {
    sql += ' WHERE material_code LIKE ? OR title LIKE ? OR subject LIKE ?';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY id DESC';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, materials: rows.map(mapMaterial) });
});

export const createMaterial = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const code = await nextCode(pool, 'study_materials', 'material_code', 'MAT');
  const data = {
    material_code: code,
    title,
    subject: String(req.body.subject || '').trim() || null,
    program: String(req.body.program || '').trim() || null,
    batch: String(req.body.batch || '').trim() || null,
    description: String(req.body.description || '').trim() || null,
    file_path: String(req.body.filePath || '').trim() || null,
    external_url: String(req.body.externalUrl || '').trim() || null,
    status: req.body.status === 'Inactive' ? 'Inactive' : 'Active'
  };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO study_materials (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM study_materials WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, material: mapMaterial(rows[0]) });
});

export const updateMaterial = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM study_materials WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Material not found.' });
  const data = {
    title: String(req.body.title || '').trim(),
    subject: String(req.body.subject || '').trim() || null,
    program: String(req.body.program || '').trim() || null,
    batch: String(req.body.batch || '').trim() || null,
    description: String(req.body.description || '').trim() || null,
    file_path: String(req.body.filePath || '').trim() || null,
    external_url: String(req.body.externalUrl || '').trim() || null,
    status: req.body.status === 'Inactive' ? 'Inactive' : 'Active'
  };
  if (!data.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const keys = Object.keys(data);
  await pool.query(
    `UPDATE study_materials SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(data), req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM study_materials WHERE id = ?', [req.params.id]);
  res.json({ success: true, material: mapMaterial(rows[0]) });
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM study_materials WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Material not found.' });
  await pool.query('DELETE FROM study_materials WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Material deleted.' });
});

export const listResultsAdmin = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  let sql = `
    SELECT r.*, s.student_code, s.name AS student_name
    FROM test_results r
    INNER JOIN students s ON s.id = r.student_id
  `;
  const params = [];
  if (search) {
    sql += ' WHERE r.result_code LIKE ? OR r.title LIKE ? OR s.name LIKE ? OR s.student_code LIKE ?';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  sql += ' ORDER BY r.id DESC';
  const [rows] = await pool.query(sql, params);
  res.json({
    success: true,
    results: rows.map((row) => ({
      ...mapResult(row),
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name
    }))
  });
});

export const createResult = asyncHandler(async (req, res) => {
  const studentId = Number(req.body.studentId);
  const title = String(req.body.title || '').trim();
  if (!studentId || !title) {
    return res.status(400).json({ success: false, error: 'Student and title are required.' });
  }
  const marks = req.body.marks === '' || req.body.marks === undefined || req.body.marks === null
    ? null
    : Number(req.body.marks);
  const maxMarks = Number(req.body.maxMarks) || 100;
  const percentage =
    marks === null || !maxMarks ? null : Math.round((1000 * marks) / maxMarks) / 10;
  const code = await nextCode(pool, 'test_results', 'result_code', 'RES');
  const data = {
    result_code: code,
    student_id: studentId,
    academic_id: req.body.academicId ? Number(req.body.academicId) || null : null,
    title,
    subject: String(req.body.subject || '').trim() || null,
    exam_date: String(req.body.examDate || '').trim() || null,
    marks,
    max_marks: maxMarks,
    percentage,
    rank_no: req.body.rankNo === '' || req.body.rankNo === undefined ? null : Number(req.body.rankNo) || null,
    remarks: String(req.body.remarks || '').trim() || null
  };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO test_results (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM test_results WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, result: mapResult(rows[0]) });
});

export const updateResult = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM test_results WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Result not found.' });
  const marks = req.body.marks === '' || req.body.marks === undefined || req.body.marks === null
    ? null
    : Number(req.body.marks);
  const maxMarks = Number(req.body.maxMarks) || 100;
  const percentage =
    marks === null || !maxMarks ? null : Math.round((1000 * marks) / maxMarks) / 10;
  const data = {
    title: String(req.body.title || '').trim(),
    subject: String(req.body.subject || '').trim() || null,
    exam_date: String(req.body.examDate || '').trim() || null,
    marks,
    max_marks: maxMarks,
    percentage,
    rank_no: req.body.rankNo === '' || req.body.rankNo === undefined ? null : Number(req.body.rankNo) || null,
    remarks: String(req.body.remarks || '').trim() || null
  };
  if (!data.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const keys = Object.keys(data);
  await pool.query(
    `UPDATE test_results SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(data), req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM test_results WHERE id = ?', [req.params.id]);
  res.json({ success: true, result: mapResult(rows[0]) });
});

export const deleteResult = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM test_results WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Result not found.' });
  await pool.query('DELETE FROM test_results WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Result deleted.' });
});
