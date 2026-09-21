import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextCode } from '../db/codes.js';
import { mapNotification } from './notification.controller.js';

const TYPES = ['Class', 'Test', 'Assignment', 'Mentorship', 'Schedule'];
const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
const ATT_STATUSES = ['Present', 'Absent', 'Leave'];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

async function getLinkedMentor(userId) {
  const [rows] = await pool.query('SELECT * FROM mentors WHERE user_id = ? LIMIT 1', [userId]);
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
    mentorId: row.mentor_id || '',
    sessionDate: row.session_date ? String(row.session_date).slice(0, 10) : '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    venue: row.venue || '',
    description: row.description || '',
    status: row.status
  };
}

function academicFields(body, mentorId) {
  return {
    title: String(body.title || '').trim(),
    type: TYPES.includes(body.type) ? body.type : 'Class',
    subject: emptyToNull(body.subject),
    program: emptyToNull(body.program),
    batch: emptyToNull(body.batch),
    mentor_id: mentorId,
    session_date: emptyToNull(body.sessionDate),
    start_time: emptyToNull(body.startTime),
    end_time: emptyToNull(body.endTime),
    venue: emptyToNull(body.venue),
    description: emptyToNull(body.description),
    status: STATUSES.includes(body.status) ? body.status : 'Upcoming'
  };
}

async function listMine(mentorId, types) {
  const clauses = ['a.mentor_id = ?'];
  const params = [mentorId];
  if (types?.length) {
    clauses.push(`a.type IN (${types.map(() => '?').join(',')})`);
    params.push(...types);
  }
  const [rows] = await pool.query(
    `SELECT a.* FROM academics a WHERE ${clauses.join(' AND ')} ORDER BY a.session_date DESC, a.id DESC`,
    params
  );
  return rows.map(mapAcademic);
}

async function assertOwnedAcademic(id, mentorId) {
  const [rows] = await pool.query('SELECT * FROM academics WHERE id = ? AND mentor_id = ? LIMIT 1', [id, mentorId]);
  return rows[0] || null;
}

export const mySessions = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  const type = String(req.query.type || '').trim();
  const types = TYPES.includes(type)
    ? [type]
    : String(req.query.types || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => TYPES.includes(t));
  const academics = await listMine(mentor.id, types.length ? types : null);
  res.json({ success: true, academics, mentorId: mentor.id });
});

export const createSession = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  const fields = academicFields(req.body, mentor.id);
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const code = await nextCode(pool, 'academics', 'academic_code', 'ACD');
  const data = { academic_code: code, ...fields };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO academics (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM academics WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, academic: mapAcademic(rows[0]) });
});

export const updateSession = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  const existing = await assertOwnedAcademic(req.params.id, mentor.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Session not found.' });
  const fields = academicFields(req.body, mentor.id);
  if (!fields.title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const keys = Object.keys(fields);
  await pool.query(
    `UPDATE academics SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(fields), existing.id]
  );
  const [rows] = await pool.query('SELECT * FROM academics WHERE id = ?', [existing.id]);
  res.json({ success: true, academic: mapAcademic(rows[0]) });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  const existing = await assertOwnedAcademic(req.params.id, mentor.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Session not found.' });
  await pool.query('DELETE FROM academics WHERE id = ?', [existing.id]);
  res.json({ success: true, message: 'Session deleted.' });
});

export const myStudents = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });

  const [batches] = await pool.query(
    `SELECT DISTINCT batch FROM academics WHERE mentor_id = ? AND batch IS NOT NULL AND batch <> ''`,
    [mentor.id]
  );
  const batchList = batches.map((b) => b.batch);
  let students = [];
  if (batchList.length) {
    const [rows] = await pool.query(
      `SELECT id, student_code, name, program, batch, phone, email, attendance, performance, status, scholarship
       FROM students
       WHERE batch IN (${batchList.map(() => '?').join(',')})
       ORDER BY name ASC`,
      batchList
    );
    students = rows;
  } else {
    const [rows] = await pool.query(
      `SELECT id, student_code, name, program, batch, phone, email, attendance, performance, status, scholarship
       FROM students WHERE status = 'Active' ORDER BY name ASC LIMIT 100`
    );
    students = rows;
  }

  res.json({
    success: true,
    batches: batchList,
    students: students.map((row) => ({
      id: row.id,
      studentCode: row.student_code,
      name: row.name,
      program: row.program || '',
      batch: row.batch || '',
      phone: row.phone || '',
      email: row.email || '',
      attendance: Number(row.attendance) || 0,
      performance: Number(row.performance) || 0,
      status: row.status,
      scholarship: row.scholarship || 'None'
    }))
  });
});

export const batchAttendance = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  const batch = String(req.query.batch || '').trim();
  const date = String(req.query.date || '').trim();
  if (!batch || !date) return res.status(400).json({ success: false, error: 'Batch and date are required.' });

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
      status: ATT_STATUSES.includes(row.status) ? row.status : '',
      remarks: row.remarks || ''
    }))
  });
});

export const saveBatchAttendance = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });

  const batch = String(req.body.batch || '').trim();
  const attendanceDate = emptyToNull(req.body.attendanceDate);
  const records = Array.isArray(req.body.records) ? req.body.records : [];
  if (!batch || !attendanceDate) {
    return res.status(400).json({ success: false, error: 'Batch and date are required.' });
  }

  const [students] = await pool.query('SELECT id FROM students WHERE batch = ?', [batch]);
  const allowed = new Set(students.map((s) => Number(s.id)));
  const studentIds = [];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const rec of records) {
      const studentId = Number(rec.studentId);
      if (!allowed.has(studentId)) continue;
      const status = ATT_STATUSES.includes(rec.status) ? rec.status : 'Present';
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

  for (const id of [...new Set(studentIds)]) {
    await pool.query(
      `UPDATE students SET attendance = (
         SELECT COALESCE(ROUND(100 * SUM(status = 'Present') / COUNT(*)), 0)
         FROM attendance WHERE student_id = ?
       ) WHERE id = ?`,
      [id, id]
    );
  }

  res.json({ success: true, message: `Saved attendance for ${studentIds.length} students.` });
});

export const myAssignmentsWithSubmissions = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });
  const assignments = await listMine(mentor.id, ['Assignment']);
  const ids = assignments.map((a) => a.id);
  let submissions = [];
  if (ids.length) {
    const [rows] = await pool.query(
      `SELECT sub.*, s.name AS student_name, s.student_code
       FROM assignment_submissions sub
       INNER JOIN students s ON s.id = sub.student_id
       WHERE sub.academic_id IN (${ids.map(() => '?').join(',')})
       ORDER BY sub.submitted_at DESC`,
      ids
    );
    submissions = rows.map((row) => ({
      id: row.id,
      academicId: row.academic_id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentCode: row.student_code,
      content: row.content || '',
      filePath: row.file_path || '',
      status: row.status,
      score: row.score === null ? null : Number(row.score),
      feedback: row.feedback || '',
      submittedAt: row.submitted_at || ''
    }));
  }
  res.json({
    success: true,
    assignments: assignments.map((a) => ({
      ...a,
      submissions: submissions.filter((s) => s.academicId === a.id)
    }))
  });
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });

  const [rows] = await pool.query(
    `SELECT sub.* FROM assignment_submissions sub
     INNER JOIN academics a ON a.id = sub.academic_id
     WHERE sub.id = ? AND a.mentor_id = ? LIMIT 1`,
    [req.params.id, mentor.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, error: 'Submission not found.' });

  const score = req.body.score === '' || req.body.score === undefined || req.body.score === null
    ? null
    : Number(req.body.score);
  const feedback = emptyToNull(req.body.feedback);
  const status = ['Submitted', 'Graded', 'Returned'].includes(req.body.status) ? req.body.status : 'Graded';

  await pool.query(
    'UPDATE assignment_submissions SET score = ?, feedback = ?, status = ? WHERE id = ?',
    [score, feedback, status, rows[0].id]
  );
  const [updated] = await pool.query('SELECT * FROM assignment_submissions WHERE id = ?', [rows[0].id]);
  res.json({
    success: true,
    submission: {
      id: updated[0].id,
      score: updated[0].score === null ? null : Number(updated[0].score),
      feedback: updated[0].feedback || '',
      status: updated[0].status
    }
  });
});

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
    status: row.status
  };
}

export const listMaterials = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM study_materials ORDER BY id DESC');
  res.json({ success: true, materials: rows.map(mapMaterial) });
});

export const createMaterial = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const code = await nextCode(pool, 'study_materials', 'material_code', 'MAT');
  const data = {
    material_code: code,
    title,
    subject: emptyToNull(req.body.subject),
    program: emptyToNull(req.body.program),
    batch: emptyToNull(req.body.batch),
    description: emptyToNull(req.body.description),
    file_path: emptyToNull(req.body.filePath),
    external_url: emptyToNull(req.body.externalUrl),
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
    subject: emptyToNull(req.body.subject),
    program: emptyToNull(req.body.program),
    batch: emptyToNull(req.body.batch),
    description: emptyToNull(req.body.description),
    file_path: emptyToNull(req.body.filePath),
    external_url: emptyToNull(req.body.externalUrl),
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

export const listAnnouncements = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications ORDER BY published_date DESC, id DESC LIMIT 50');
  res.json({ success: true, notifications: rows.map(mapNotification) });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const code = await nextCode(pool, 'notifications', 'notification_code', 'NOT');
  const data = {
    notification_code: code,
    title,
    message: emptyToNull(req.body.message),
    type: emptyToNull(req.body.type) || 'Academic',
    channel: emptyToNull(req.body.channel) || 'Push Notification',
    published_date: emptyToNull(req.body.publishedDate) || new Date().toISOString().slice(0, 10),
    status: 'Active'
  };
  const keys = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO notifications (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    Object.values(data)
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, notification: mapNotification(rows[0]) });
});

export const myReports = asyncHandler(async (req, res) => {
  const mentor = await getLinkedMentor(req.user.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'No mentor profile is linked to this login.' });

  const [batches] = await pool.query(
    `SELECT DISTINCT batch FROM academics WHERE mentor_id = ? AND batch IS NOT NULL AND batch <> ''`,
    [mentor.id]
  );
  const batchList = batches.map((b) => b.batch);

  let studentStats = { total: 0, active: 0, avgAttendance: 0, avgPerformance: 0 };
  if (batchList.length) {
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(status = 'Active') AS active,
              ROUND(AVG(attendance), 1) AS avgAttendance, ROUND(AVG(performance), 1) AS avgPerformance
       FROM students WHERE batch IN (${batchList.map(() => '?').join(',')})`,
      batchList
    );
    studentStats = {
      total: Number(stats.total) || 0,
      active: Number(stats.active) || 0,
      avgAttendance: Number(stats.avgAttendance) || 0,
      avgPerformance: Number(stats.avgPerformance) || 0
    };
  }

  const [[sessions]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(type = 'Class') AS classes,
            SUM(type = 'Test') AS tests,
            SUM(type = 'Assignment') AS assignments,
            SUM(type = 'Mentorship') AS mentorship
     FROM academics WHERE mentor_id = ?`,
    [mentor.id]
  );

  const [byBatch] = batchList.length
    ? await pool.query(
        `SELECT batch AS name, COUNT(*) AS value, ROUND(AVG(attendance), 1) AS avgAttendance
         FROM students WHERE batch IN (${batchList.map(() => '?').join(',')})
         GROUP BY batch ORDER BY value DESC`,
        batchList
      )
    : [[]];

  res.json({
    success: true,
    studentStats,
    sessions: {
      total: Number(sessions.total) || 0,
      classes: Number(sessions.classes) || 0,
      tests: Number(sessions.tests) || 0,
      assignments: Number(sessions.assignments) || 0,
      mentorship: Number(sessions.mentorship) || 0
    },
    byBatch
  });
});
