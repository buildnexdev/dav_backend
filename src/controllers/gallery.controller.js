import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { cleanupFileArray, saveGalleryFiles, saveGalleryImage } from '../middleware/upload.js';
import { nextCode } from '../db/codes.js';

const STATUSES = ['Active', 'Inactive'];
export const GALLERY_FIELDS = [
  'Home',
  'About',
  'Campus',
  'Classrooms',
  'Hostel',
  'Events',
  'Workshops',
  'Felicitation',
  'Student Activities',
  'Alumni',
  'News',
  'Success Stories'
];

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

export function mapGallery(row) {
  return {
    id: row.id,
    galleryCode: row.gallery_code,
    fieldName: row.field_name,
    caption: row.caption || '',
    image: row.image_path || '',
    status: row.status,
    updatedAt: row.updated_at || ''
  };
}

export const listGallery = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const field = String(req.query.field || '').trim();
  const status = String(req.query.status || '').trim();
  const clauses = [];
  const params = [];
  if (search) {
    clauses.push('(gallery_code LIKE ? OR field_name LIKE ? OR caption LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (field) {
    clauses.push('field_name = ?');
    params.push(field);
  }
  if (STATUSES.includes(status)) {
    clauses.push('status = ?');
    params.push(status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM gallery_images${where} ORDER BY id DESC`, params);
  res.json({ success: true, fields: GALLERY_FIELDS, images: rows.map(mapGallery) });
});

export const listPublicGallery = asyncHandler(async (req, res) => {
  const field = String(req.query.field || '').trim();
  const params = [];
  let sql = "SELECT * FROM gallery_images WHERE status = 'Active'";
  if (field && field !== 'All') {
    sql += ' AND field_name = ?';
    params.push(field);
  }
  sql += ' ORDER BY id DESC';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, fields: GALLERY_FIELDS, images: rows.map(mapGallery) });
});

export const createGallery = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length < 1 || files.length > 10) {
    cleanupFileArray(files);
    return res.status(400).json({ success: false, error: 'Upload between 1 and 10 images at a time (5 to 10 recommended).' });
  }

  const fieldName = String(req.body.fieldName || '').trim();
  if (!fieldName) {
    cleanupFileArray(files);
    return res.status(400).json({ success: false, error: 'Select the website field where these images should appear.' });
  }

  const status = STATUSES.includes(req.body.status) ? req.body.status : 'Active';
  const captions = Array.isArray(req.body.captions)
    ? req.body.captions
    : String(req.body.captions || '').split('||');

  const codes = [];
  try {
    for (let i = 0; i < files.length; i += 1) {
      const code = await nextCode(pool, 'gallery_images', 'gallery_code', 'GAL');
      const imagePath = saveGalleryFiles([files[i]], [code])[0];
      if (!imagePath) continue;
      await pool.query(
        'INSERT INTO gallery_images (gallery_code, field_name, caption, image_path, status) VALUES (?, ?, ?, ?, ?)',
        [code, fieldName, emptyToNull(captions[i]), imagePath, status]
      );
      codes.push(code);
    }
  } catch (err) {
    cleanupFileArray(files);
    throw err;
  }

  if (!codes.length) {
    return res.status(400).json({ success: false, error: 'Could not save the uploaded images.' });
  }

  const [rows] = await pool.query(
    `SELECT * FROM gallery_images WHERE gallery_code IN (${codes.map(() => '?').join(', ')}) ORDER BY id DESC`,
    codes
  );
  res.status(201).json({ success: true, images: rows.map(mapGallery) });
});

export const updateGallery = asyncHandler(async (req, res) => {
  const [existingRows] = await pool.query('SELECT * FROM gallery_images WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existingRows.length) {
    cleanupFileArray(req.files);
    return res.status(404).json({ success: false, error: 'Gallery image not found.' });
  }
  const existing = existingRows[0];
  const fieldName = String(req.body.fieldName || existing.field_name).trim();
  const caption = req.body.caption === undefined ? existing.caption : emptyToNull(req.body.caption);
  const status = STATUSES.includes(req.body.status) ? req.body.status : existing.status;
  const filePaths = saveGalleryImage(req.files, existing.gallery_code);
  await pool.query(
    'UPDATE gallery_images SET field_name = ?, caption = ?, status = ?, image_path = ? WHERE id = ?',
    [fieldName, caption, status, filePaths.image_path || existing.image_path, existing.id]
  );
  const [rows] = await pool.query('SELECT * FROM gallery_images WHERE id = ?', [existing.id]);
  res.json({ success: true, image: mapGallery(rows[0]) });
});

export const setGalleryStatus = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM gallery_images WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Gallery image not found.' });
  const status = STATUSES.includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
  await pool.query('UPDATE gallery_images SET status = ? WHERE id = ?', [status, req.params.id]);
  const [rows] = await pool.query('SELECT * FROM gallery_images WHERE id = ?', [req.params.id]);
  res.json({ success: true, image: mapGallery(rows[0]) });
});

export const deleteGallery = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM gallery_images WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Gallery image not found.' });
  await pool.query('DELETE FROM gallery_images WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Gallery image deleted.' });
});
