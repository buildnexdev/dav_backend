export const STUDENT_PAGES = [
  { key: 'dashboard', label: 'Dashboard', required: true },
  { key: 'profile', label: 'My Profile' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'tests', label: 'Tests' },
  { key: 'results', label: 'Results' },
  { key: 'materials', label: 'Study Materials' },
  { key: 'current-affairs', label: 'Current Affairs' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'scholarship', label: 'Scholarship' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'payments', label: 'Payments' }
];

export const MENTOR_PAGES = [
  { key: 'dashboard', label: 'Dashboard', required: true },
  { key: 'profile', label: 'My Profile' },
  { key: 'classes', label: 'My Classes' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'students', label: 'Students' },
  { key: 'tests', label: 'Tests' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'materials', label: 'Study Materials' },
  { key: 'mentorship', label: 'Mentorship' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'reports', label: 'Reports' }
];

export function pageKeys(pages) {
  return pages.map((page) => page.key);
}

export function sanitizePages(keys, pages) {
  const allowed = new Set(pageKeys(pages));
  const next = [];
  for (const key of Array.isArray(keys) ? keys : []) {
    const value = String(key || '').trim();
    if (allowed.has(value) && !next.includes(value)) next.push(value);
  }
  for (const page of pages) {
    if (page.required && !next.includes(page.key)) next.unshift(page.key);
  }
  return next;
}

export function parsePages(raw, pages) {
  if (!raw) return pageKeys(pages);
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const sanitized = sanitizePages(parsed, pages);
    return sanitized.length ? sanitized : pageKeys(pages);
  } catch {
    return pageKeys(pages);
  }
}
