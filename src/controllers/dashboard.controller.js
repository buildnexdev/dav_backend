import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export const adminDashboard = asyncHandler(async (req, res) => {
  const [[students]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Active') AS active,
      SUM(status = 'Inactive') AS inactive,
      SUM(status = 'Graduated') AS graduated,
      ROUND(AVG(attendance), 1) AS avgAttendance,
      ROUND(AVG(performance), 1) AS avgPerformance
    FROM students
  `);

  const [[mentors]] = await pool.query(`
    SELECT COUNT(*) AS total, SUM(status = 'Active') AS active FROM mentors
  `);

  const [[academics]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Upcoming') AS upcoming,
      SUM(status = 'Ongoing') AS ongoing,
      SUM(status = 'Completed') AS completed
    FROM academics
  `);

  const [[attendanceToday]] = await pool.query(`
    SELECT
      COUNT(*) AS marked,
      SUM(status = 'Present') AS present,
      SUM(status = 'Absent') AS absent,
      SUM(status = 'Leave') AS onLeave
    FROM attendance
    WHERE attendance_date = CURDATE()
  `);

  const [[payments]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Completed') AS completedCount,
      SUM(status IN ('Pending','Created')) AS pendingCount,
      SUM(status = 'Failed') AS failedCount,
      COALESCE(SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END), 0) AS collected
    FROM payments
  `);

  const [[alumni]] = await pool.query(`
    SELECT COUNT(*) AS total, SUM(status = 'Active') AS active FROM alumni
  `);

  const [[news]] = await pool.query(`
    SELECT COUNT(*) AS total, SUM(status = 'Active') AS active FROM news
  `);

  const [[notifications]] = await pool.query(`
    SELECT COUNT(*) AS total, SUM(status = 'Active') AS active FROM notifications
  `);

  const [byBatch] = await pool.query(`
    SELECT COALESCE(NULLIF(batch, ''), 'Unassigned') AS name, COUNT(*) AS value
    FROM students
    GROUP BY COALESCE(NULLIF(batch, ''), 'Unassigned')
    ORDER BY value DESC
  `);

  const [byStudentStatus] = await pool.query(`
    SELECT status AS name, COUNT(*) AS value FROM students GROUP BY status
  `);

  const [byMonth] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS enrolled
    FROM students
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month ASC
  `);

  const [attendanceTrend] = await pool.query(`
    SELECT
      DATE_FORMAT(attendance_date, '%Y-%m-%d') AS date,
      SUM(status = 'Present') AS present,
      SUM(status = 'Absent') AS absent,
      SUM(status = 'Leave') AS onLeave
    FROM attendance
    WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY attendance_date
    ORDER BY attendance_date ASC
  `);

  const [paymentsByCategory] = await pool.query(`
    SELECT category AS name, COALESCE(SUM(amount), 0) AS value
    FROM payments
    WHERE status = 'Completed'
    GROUP BY category
    ORDER BY value DESC
  `);

  const [recentStudents] = await pool.query(`
    SELECT student_code AS studentCode, name, program, batch, status, attendance
    FROM students
    ORDER BY id DESC
    LIMIT 6
  `);

  const [recentPayments] = await pool.query(`
    SELECT payment_code AS paymentCode, payer_name AS payerName, category, amount, status, created_at AS createdAt
    FROM payments
    ORDER BY id DESC
    LIMIT 6
  `);

  const markedToday = n(attendanceToday.marked);
  const presentToday = n(attendanceToday.present);

  res.json({
    success: true,
    stats: {
      students: n(students.total),
      studentsActive: n(students.active),
      studentsGraduated: n(students.graduated),
      avgAttendance: n(students.avgAttendance),
      avgPerformance: n(students.avgPerformance),
      mentors: n(mentors.total),
      mentorsActive: n(mentors.active),
      academicsUpcoming: n(academics.upcoming),
      academicsOngoing: n(academics.ongoing),
      attendanceToday: markedToday ? Math.round((presentToday / markedToday) * 100) : 0,
      attendanceMarkedToday: markedToday,
      paymentsCollected: n(payments.collected),
      paymentsPending: n(payments.pendingCount),
      alumniActive: n(alumni.active),
      newsActive: n(news.active),
      notificationsActive: n(notifications.active)
    },
    charts: {
      byBatch: byBatch.map((row) => ({ name: row.name, value: n(row.value) })),
      byStudentStatus: byStudentStatus.map((row) => ({ name: row.name, value: n(row.value) })),
      byMonth: byMonth.map((row) => ({ month: row.month, enrolled: n(row.enrolled) })),
      attendanceTrend: attendanceTrend.map((row) => ({
        date: row.date,
        present: n(row.present),
        absent: n(row.absent),
        leave: n(row.onLeave)
      })),
      paymentsByCategory: paymentsByCategory.map((row) => ({ name: row.name, value: n(row.value) }))
    },
    recentStudents: recentStudents.map((row) => ({
      studentCode: row.studentCode,
      name: row.name,
      program: row.program || '',
      batch: row.batch || '',
      status: row.status,
      attendance: n(row.attendance)
    })),
    recentPayments: recentPayments.map((row) => ({
      paymentCode: row.paymentCode,
      payerName: row.payerName || '—',
      category: row.category,
      amount: n(row.amount),
      status: row.status
    }))
  });
});

export const studentDashboard = asyncHandler(async (req, res) => {
  const [students] = await pool.query('SELECT * FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
  if (!students.length) {
    return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
  }
  const student = students[0];

  const [upcoming] = await pool.query(
    `SELECT academic_code AS academicCode, title, type, subject, session_date AS sessionDate, start_time AS startTime, venue, status
     FROM academics
     WHERE status IN ('Upcoming','Ongoing')
       AND (batch IS NULL OR batch = '' OR batch = ?)
     ORDER BY session_date ASC, id ASC
     LIMIT 6`,
    [student.batch]
  );

  const [attendanceRows] = await pool.query(
    `SELECT attendance_date AS attendanceDate, status, remarks
     FROM attendance
     WHERE student_id = ?
     ORDER BY attendance_date DESC
     LIMIT 8`,
    [student.id]
  );

  const [notifications] = await pool.query(
    `SELECT title, message, type, published_date AS publishedDate
     FROM notifications
     WHERE status = 'Active'
     ORDER BY published_date DESC, id DESC
     LIMIT 6`
  );

  const [payments] = await pool.query(
    `SELECT payment_code AS paymentCode, category, amount, status, created_at AS createdAt
     FROM payments
     WHERE student_id = ?
     ORDER BY id DESC
     LIMIT 6`,
    [student.id]
  );

  const [[paymentSum]] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END), 0) AS paid
     FROM payments WHERE student_id = ?`,
    [student.id]
  );

  res.json({
    success: true,
    student: {
      studentCode: student.student_code,
      name: student.name,
      program: student.program || '',
      batch: student.batch || '',
      hostel: student.hostel || '',
      room: student.room || '',
      scholarship: student.scholarship || 'None',
      status: student.status,
      attendance: n(student.attendance),
      performance: n(student.performance)
    },
    upcoming: upcoming.map((row) => ({
      ...row,
      sessionDate: row.sessionDate ? String(row.sessionDate).slice(0, 10) : ''
    })),
    attendance: attendanceRows.map((row) => ({
      attendanceDate: row.attendanceDate ? String(row.attendanceDate).slice(0, 10) : '',
      status: row.status,
      remarks: row.remarks || ''
    })),
    notifications: notifications.map((row) => ({
      title: row.title,
      message: row.message || '',
      type: row.type || '',
      publishedDate: row.publishedDate ? String(row.publishedDate).slice(0, 10) : ''
    })),
    payments: payments.map((row) => ({
      paymentCode: row.paymentCode,
      category: row.category,
      amount: n(row.amount),
      status: row.status
    })),
    paid: n(paymentSum.paid)
  });
});

export const staffDashboard = asyncHandler(async (req, res) => {
  const [[students]] = await pool.query(`
    SELECT COUNT(*) AS total, SUM(status = 'Active') AS active, ROUND(AVG(attendance), 1) AS avgAttendance
    FROM students
  `);
  const [[classesToday]] = await pool.query(`
    SELECT COUNT(*) AS total FROM academics WHERE session_date = CURDATE()
  `);
  const [[attendanceToday]] = await pool.query(`
    SELECT COUNT(*) AS marked, SUM(status = 'Present') AS present
    FROM attendance WHERE attendance_date = CURDATE()
  `);
  const [[upcomingTests]] = await pool.query(`
    SELECT COUNT(*) AS total FROM academics WHERE type = 'Test' AND status IN ('Upcoming','Ongoing')
  `);
  const [recentStudents] = await pool.query(`
    SELECT name, program, attendance, performance, status
    FROM students WHERE status = 'Active' ORDER BY id DESC LIMIT 8
  `);
  const [todaySessions] = await pool.query(`
    SELECT title, type, start_time AS startTime, venue, status
    FROM academics WHERE session_date = CURDATE() ORDER BY start_time ASC LIMIT 8
  `);

  const marked = n(attendanceToday.marked);
  res.json({
    success: true,
    stats: {
      classesToday: n(classesToday.total),
      studentsActive: n(students.active),
      avgAttendance: n(students.avgAttendance),
      attendanceToday: marked ? Math.round((n(attendanceToday.present) / marked) * 100) : 0,
      upcomingTests: n(upcomingTests.total)
    },
    recentStudents: recentStudents.map((row) => ({
      name: row.name,
      program: row.program || '',
      attendance: n(row.attendance),
      performance: n(row.performance),
      status: row.status
    })),
    todaySessions
  });
});
