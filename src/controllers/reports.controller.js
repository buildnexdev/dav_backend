import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function sliceDate(value) {
  return value ? String(value).slice(0, 10) : '';
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

const MODULES = {
  students: {
    label: 'Students',
    from: 'students s',
    select: `s.student_code, s.name, s.program, s.batch, s.phone, s.email, s.attendance, s.performance, s.status, s.created_at`,
    dateCol: 'DATE(s.created_at)',
    statusCol: 's.status',
    batchCol: 's.batch',
    extraCol: 's.program',
    extraLabel: 'Program',
    groupCol: `COALESCE(NULLIF(s.batch, ''), 'Unassigned')`,
    groupLabel: 'Batch',
    trendCol: `DATE_FORMAT(s.created_at, '%Y-%m')`,
    trendLabel: 'Enrollment by month',
    statuses: ['Active', 'Inactive', 'Graduated'],
    searchSql: '(s.student_code LIKE ? OR s.name LIKE ? OR s.email LIKE ? OR s.program LIKE ? OR s.batch LIKE ?)',
    searchArity: 5,
    order: 's.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'program', label: 'Program' },
      { key: 'batch', label: 'Batch' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'attendance', label: 'Attendance %' },
      { key: 'status', label: 'Status' }
    ],
    map(row) {
      return {
        id: row.student_code,
        name: row.name,
        program: row.program || '',
        batch: row.batch || '',
        phone: row.phone || '',
        email: row.email || '',
        attendance: n(row.attendance),
        status: row.status
      };
    }
  },
  mentors: {
    label: 'Mentors',
    from: 'mentors m',
    select: `m.mentor_code, m.name, m.designation, m.subject, m.experience, m.phone, m.email, m.status, m.created_at`,
    dateCol: 'DATE(m.created_at)',
    statusCol: 'm.status',
    extraCol: 'm.subject',
    extraLabel: 'Subject',
    groupCol: `COALESCE(NULLIF(m.subject, ''), 'Unassigned')`,
    groupLabel: 'Subject',
    trendCol: `DATE_FORMAT(m.created_at, '%Y-%m')`,
    trendLabel: 'Added by month',
    statuses: ['Active', 'Inactive'],
    searchSql: '(m.mentor_code LIKE ? OR m.name LIKE ? OR m.subject LIKE ? OR m.designation LIKE ? OR m.email LIKE ?)',
    searchArity: 5,
    order: 'm.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Designation' },
      { key: 'subject', label: 'Subject' },
      { key: 'experience', label: 'Experience' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' }
    ],
    map(row) {
      return {
        id: row.mentor_code,
        name: row.name,
        designation: row.designation || '',
        subject: row.subject || '',
        experience: n(row.experience),
        phone: row.phone || '',
        email: row.email || '',
        status: row.status
      };
    }
  },
  academics: {
    label: 'Academics',
    from: 'academics a LEFT JOIN mentors mn ON mn.id = a.mentor_id',
    select: `a.academic_code, a.title, a.type, a.subject, a.batch, a.session_date, a.start_time, a.venue, a.status, mn.name AS mentor_name`,
    dateCol: 'a.session_date',
    statusCol: 'a.status',
    batchCol: 'a.batch',
    extraCol: 'a.type',
    extraLabel: 'Type',
    groupCol: 'a.type',
    groupLabel: 'Type',
    trendCol: `DATE_FORMAT(a.session_date, '%Y-%m')`,
    trendLabel: 'Sessions by month',
    statuses: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    searchSql: '(a.academic_code LIKE ? OR a.title LIKE ? OR a.subject LIKE ? OR a.batch LIKE ? OR mn.name LIKE ?)',
    searchArity: 5,
    order: 'a.session_date DESC, a.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'subject', label: 'Subject' },
      { key: 'batch', label: 'Batch' },
      { key: 'sessionDate', label: 'Date' },
      { key: 'mentor', label: 'Mentor' },
      { key: 'status', label: 'Status' }
    ],
    map(row) {
      return {
        id: row.academic_code,
        title: row.title,
        type: row.type,
        subject: row.subject || '',
        batch: row.batch || '',
        sessionDate: sliceDate(row.session_date),
        mentor: row.mentor_name || '',
        status: row.status
      };
    }
  },
  attendance: {
    label: 'Attendance',
    from: 'attendance att INNER JOIN students st ON st.id = att.student_id',
    select: `st.student_code, st.name AS student_name, att.attendance_date, att.status, att.batch, att.remarks`,
    dateCol: 'att.attendance_date',
    statusCol: 'att.status',
    batchCol: 'att.batch',
    groupCol: `COALESCE(NULLIF(att.batch, ''), 'Unassigned')`,
    groupLabel: 'Batch',
    trendCol: `DATE_FORMAT(att.attendance_date, '%Y-%m-%d')`,
    trendLabel: 'Marked by date',
    statuses: ['Present', 'Absent', 'Leave'],
    searchSql: '(st.student_code LIKE ? OR st.name LIKE ? OR att.batch LIKE ?)',
    searchArity: 3,
    order: 'att.attendance_date DESC, att.id DESC',
    columns: [
      { key: 'id', label: 'Student ID' },
      { key: 'name', label: 'Student' },
      { key: 'attendanceDate', label: 'Date' },
      { key: 'batch', label: 'Batch' },
      { key: 'status', label: 'Status' },
      { key: 'remarks', label: 'Remarks' }
    ],
    map(row) {
      return {
        id: row.student_code,
        name: row.student_name,
        attendanceDate: sliceDate(row.attendance_date),
        batch: row.batch || '',
        status: row.status,
        remarks: row.remarks || ''
      };
    }
  },
  alumni: {
    label: 'Alumni',
    from: 'alumni al',
    select: `al.alumni_code, al.name, al.year, al.air, al.service, al.cadre, al.current_posting, al.status, al.created_at`,
    dateCol: 'DATE(al.created_at)',
    statusCol: 'al.status',
    extraCol: 'al.service',
    extraLabel: 'Service',
    groupCol: `COALESCE(NULLIF(al.service, ''), 'Unassigned')`,
    groupLabel: 'Service',
    trendCol: `COALESCE(CAST(al.year AS CHAR), DATE_FORMAT(al.created_at, '%Y'))`,
    trendLabel: 'By year',
    statuses: ['Active', 'Inactive'],
    searchSql: '(al.alumni_code LIKE ? OR al.name LIKE ? OR al.service LIKE ? OR al.cadre LIKE ?)',
    searchArity: 4,
    order: 'al.year DESC, al.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'year', label: 'Year' },
      { key: 'air', label: 'AIR' },
      { key: 'service', label: 'Service' },
      { key: 'cadre', label: 'Cadre' },
      { key: 'posting', label: 'Posting' },
      { key: 'status', label: 'Status' }
    ],
    map(row) {
      return {
        id: row.alumni_code,
        name: row.name,
        year: row.year || '',
        air: row.air || '',
        service: row.service || '',
        cadre: row.cadre || '',
        posting: row.current_posting || '',
        status: row.status
      };
    }
  },
  gallery: {
    label: 'Gallery',
    from: 'gallery_images g',
    select: `g.gallery_code, g.field_name, g.caption, g.status, g.created_at`,
    dateCol: 'DATE(g.created_at)',
    statusCol: 'g.status',
    extraCol: 'g.field_name',
    extraLabel: 'Website field',
    groupCol: 'g.field_name',
    groupLabel: 'Website field',
    trendCol: `DATE_FORMAT(g.created_at, '%Y-%m')`,
    trendLabel: 'Uploaded by month',
    statuses: ['Active', 'Inactive'],
    searchSql: '(g.gallery_code LIKE ? OR g.field_name LIKE ? OR g.caption LIKE ?)',
    searchArity: 3,
    order: 'g.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'fieldName', label: 'Website field' },
      { key: 'caption', label: 'Caption' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Uploaded' }
    ],
    map(row) {
      return {
        id: row.gallery_code,
        fieldName: row.field_name,
        caption: row.caption || '',
        status: row.status,
        createdAt: sliceDate(row.created_at)
      };
    }
  },
  news: {
    label: 'News',
    from: 'news n',
    select: `n.news_code, n.title, n.category, n.published_date, n.status`,
    dateCol: 'n.published_date',
    statusCol: 'n.status',
    extraCol: 'n.category',
    extraLabel: 'Category',
    groupCol: `COALESCE(NULLIF(n.category, ''), 'Unassigned')`,
    groupLabel: 'Category',
    trendCol: `DATE_FORMAT(n.published_date, '%Y-%m')`,
    trendLabel: 'Published by month',
    statuses: ['Active', 'Inactive'],
    searchSql: '(n.news_code LIKE ? OR n.title LIKE ? OR n.category LIKE ?)',
    searchArity: 3,
    order: 'n.published_date DESC, n.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'publishedDate', label: 'Date' },
      { key: 'status', label: 'Status' }
    ],
    map(row) {
      return {
        id: row.news_code,
        title: row.title,
        category: row.category || '',
        publishedDate: sliceDate(row.published_date),
        status: row.status
      };
    }
  },
  notifications: {
    label: 'Notifications',
    from: 'notifications nt',
    select: `nt.notification_code, nt.title, nt.type, nt.channel, nt.published_date, nt.status`,
    dateCol: 'nt.published_date',
    statusCol: 'nt.status',
    extraCol: 'nt.type',
    extraLabel: 'Type',
    groupCol: `COALESCE(NULLIF(nt.type, ''), 'Unassigned')`,
    groupLabel: 'Type',
    trendCol: `DATE_FORMAT(nt.published_date, '%Y-%m')`,
    trendLabel: 'Sent by month',
    statuses: ['Active', 'Inactive'],
    searchSql: '(nt.notification_code LIKE ? OR nt.title LIKE ? OR nt.type LIKE ? OR nt.channel LIKE ?)',
    searchArity: 4,
    order: 'nt.published_date DESC, nt.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'channel', label: 'Channel' },
      { key: 'publishedDate', label: 'Date' },
      { key: 'status', label: 'Status' }
    ],
    map(row) {
      return {
        id: row.notification_code,
        title: row.title,
        type: row.type || '',
        channel: row.channel || '',
        publishedDate: sliceDate(row.published_date),
        status: row.status
      };
    }
  },
  payments: {
    label: 'Payments',
    from: 'payments p LEFT JOIN students ps ON ps.id = p.student_id',
    select: `p.payment_code, p.payer_name, ps.name AS student_name, ps.student_code, p.category, p.amount, p.method, p.status, p.created_at`,
    dateCol: 'DATE(p.created_at)',
    statusCol: 'p.status',
    extraCol: 'p.category',
    extraLabel: 'Category',
    groupCol: 'p.category',
    groupLabel: 'Category',
    groupValue: 'p.amount',
    trendCol: `DATE_FORMAT(p.created_at, '%Y-%m')`,
    trendValue: 'p.amount',
    trendLabel: 'Amount by month',
    statuses: ['Created', 'Pending', 'Completed', 'Failed'],
    searchSql: '(p.payment_code LIKE ? OR p.payer_name LIKE ? OR p.email LIKE ? OR p.category LIKE ? OR ps.name LIKE ? OR ps.student_code LIKE ?)',
    searchArity: 6,
    order: 'p.id DESC',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'payer', label: 'Payer' },
      { key: 'student', label: 'Student' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Date' }
    ],
    map(row) {
      return {
        id: row.payment_code,
        payer: row.payer_name || row.student_name || '',
        student: row.student_code || '',
        category: row.category,
        amount: n(row.amount),
        method: row.method || '',
        status: row.status,
        createdAt: sliceDate(row.created_at)
      };
    }
  }
};

function buildWhere(cfg, query) {
  const clauses = [];
  const params = [];
  const search = String(query.search || '').trim();
  const status = String(query.status || '').trim();
  const batch = String(query.batch || '').trim();
  const extra = String(query.extra || '').trim();
  const from = String(query.from || '').trim();
  const to = String(query.to || '').trim();

  if (search && cfg.searchSql) {
    clauses.push(cfg.searchSql);
    const like = `%${search}%`;
    for (let i = 0; i < cfg.searchArity; i += 1) params.push(like);
  }
  if (status && cfg.statuses.includes(status)) {
    clauses.push(`${cfg.statusCol} = ?`);
    params.push(status);
  }
  if (batch && cfg.batchCol) {
    clauses.push(`${cfg.batchCol} = ?`);
    params.push(batch);
  }
  if (extra && cfg.extraCol) {
    clauses.push(`${cfg.extraCol} = ?`);
    params.push(extra);
  }
  if (isDate(from) && cfg.dateCol) {
    clauses.push(`${cfg.dateCol} >= ?`);
    params.push(from);
  }
  if (isDate(to) && cfg.dateCol) {
    clauses.push(`${cfg.dateCol} <= ?`);
    params.push(to);
  }

  return {
    where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '',
    params
  };
}

function chartRows(rows, valueKey = 'value') {
  return rows.map((row) => ({
    name: row.name == null || row.name === '' ? 'Unassigned' : String(row.name),
    value: n(row[valueKey])
  }));
}

export const getReport = asyncHandler(async (req, res) => {
  const moduleKey = String(req.params.module || req.query.module || 'students').trim();
  const cfg = MODULES[moduleKey];
  if (!cfg) {
    return res.status(400).json({ success: false, error: 'Unknown report module.' });
  }

  const { where, params } = buildWhere(cfg, req.query);

  const [rawRows] = await pool.query(
    `SELECT ${cfg.select} FROM ${cfg.from}${where} ORDER BY ${cfg.order} LIMIT 500`,
    params
  );

  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS total FROM ${cfg.from}${where}`,
    params
  );

  const [byStatus] = await pool.query(
    `SELECT ${cfg.statusCol} AS name, COUNT(*) AS value
     FROM ${cfg.from}${where}
     GROUP BY ${cfg.statusCol}
     ORDER BY value DESC`,
    params
  );

  const [byGroup] = await pool.query(
    `SELECT ${cfg.groupCol} AS name, ${cfg.groupValue ? `COALESCE(SUM(${cfg.groupValue}), 0)` : 'COUNT(*)'} AS value
     FROM ${cfg.from}${where}
     GROUP BY ${cfg.groupCol}
     ORDER BY value DESC`,
    params
  );

  const [byTrend] = await pool.query(
    `SELECT ${cfg.trendCol} AS name, ${cfg.trendValue ? `COALESCE(SUM(${cfg.trendValue}), 0)` : 'COUNT(*)'} AS value
     FROM ${cfg.from}${where}
     GROUP BY ${cfg.trendCol}
     ORDER BY name ASC`,
    params
  );

  const [batches] = cfg.batchCol
    ? await pool.query(
      `SELECT DISTINCT ${cfg.batchCol} AS name FROM ${cfg.from}
       WHERE ${cfg.batchCol} IS NOT NULL AND ${cfg.batchCol} <> ''
       ORDER BY name ASC`
    )
    : [[]];

  const [extras] = cfg.extraCol
    ? await pool.query(
      `SELECT DISTINCT ${cfg.extraCol} AS name FROM ${cfg.from}
       WHERE ${cfg.extraCol} IS NOT NULL AND ${cfg.extraCol} <> ''
       ORDER BY name ASC`
    )
    : [[]];

  const summary = { total: n(totals.total) };
  if (moduleKey === 'payments') {
    const [[money]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN p.status = 'Completed' THEN p.amount ELSE 0 END), 0) AS collected,
         COALESCE(SUM(CASE WHEN p.status IN ('Pending','Created') THEN p.amount ELSE 0 END), 0) AS pendingAmount
       FROM ${cfg.from}${where}`,
      params
    );
    summary.collected = n(money.collected);
    summary.pendingAmount = n(money.pendingAmount);
  }
  if (moduleKey === 'students') {
    const [[stats]] = await pool.query(
      `SELECT ROUND(AVG(s.attendance), 1) AS avgAttendance, SUM(s.status = 'Active') AS active
       FROM ${cfg.from}${where}`,
      params
    );
    summary.avgAttendance = n(stats.avgAttendance);
    summary.active = n(stats.active);
  }
  if (moduleKey === 'attendance') {
    const present = byStatus.find((row) => row.name === 'Present');
    summary.present = n(present?.value);
  }

  res.json({
    success: true,
    module: moduleKey,
    label: cfg.label,
    columns: cfg.columns,
    rows: rawRows.map((row) => cfg.map(row)),
    summary,
    charts: {
      byStatus: chartRows(byStatus),
      byGroup: chartRows(byGroup),
      byTrend: chartRows(byTrend).filter((row) => row.name && row.name !== 'null')
    },
    meta: {
      groupLabel: cfg.groupLabel,
      extraLabel: cfg.extraLabel || '',
      trendLabel: cfg.trendLabel,
      statuses: cfg.statuses,
      batches: batches.map((row) => row.name).filter(Boolean),
      extras: extras.map((row) => row.name).filter(Boolean),
      hasBatch: Boolean(cfg.batchCol),
      hasExtra: Boolean(cfg.extraCol),
      money: moduleKey === 'payments'
    }
  });
});

export const listReportModules = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    modules: Object.entries(MODULES).map(([id, cfg]) => ({ id, label: cfg.label }))
  });
});
