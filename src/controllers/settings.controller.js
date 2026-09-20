import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { MENTOR_PAGES, STUDENT_PAGES, pageKeys, parsePages, sanitizePages } from '../data/accessPages.js';

async function readSettings() {
  const [rows] = await pool.query('SELECT student_pages, mentor_pages FROM settings WHERE id = 1 LIMIT 1');
  const row = rows[0] || {};
  return {
    studentPages: parsePages(row.student_pages, STUDENT_PAGES),
    mentorPages: parsePages(row.mentor_pages, MENTOR_PAGES)
  };
}

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await readSettings();
  res.json({
    success: true,
    ...settings,
    catalog: {
      student: STUDENT_PAGES,
      mentor: MENTOR_PAGES
    }
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const studentPages = sanitizePages(req.body?.studentPages, STUDENT_PAGES);
  const mentorPages = sanitizePages(req.body?.mentorPages, MENTOR_PAGES);

  await pool.query(
    `INSERT INTO settings (id, student_pages, mentor_pages)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE student_pages = VALUES(student_pages), mentor_pages = VALUES(mentor_pages)`,
    [JSON.stringify(studentPages), JSON.stringify(mentorPages)]
  );

  res.json({
    success: true,
    studentPages,
    mentorPages,
    catalog: {
      student: STUDENT_PAGES,
      mentor: MENTOR_PAGES
    }
  });
});

export const getMyAccess = asyncHandler(async (req, res) => {
  const settings = await readSettings();
  const role = req.user?.role;
  let pages = pageKeys(role === 'student' ? STUDENT_PAGES : MENTOR_PAGES);
  if (role === 'student') pages = settings.studentPages;
  if (role === 'staff') pages = settings.mentorPages;
  if (role === 'admin') pages = ['*'];
  res.json({ success: true, role, pages, ...settings });
});
