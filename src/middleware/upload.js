import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { studentUploadsRoot, mentorUploadsRoot, alumniUploadsRoot, galleryUploadsRoot, tmpUploadsRoot } from '../config/paths.js';

fs.mkdirSync(studentUploadsRoot, { recursive: true });
fs.mkdirSync(mentorUploadsRoot, { recursive: true });
fs.mkdirSync(alumniUploadsRoot, { recursive: true });
fs.mkdirSync(galleryUploadsRoot, { recursive: true });
fs.mkdirSync(tmpUploadsRoot, { recursive: true });

export const FILE_FIELDS = [
  'birthCertificate',
  'photograph',
  'fatherQualificationProof',
  'motherQualificationProof',
  'fatherOccupationProof',
  'motherOccupationProof',
  'incomeCertificate',
  'addressProof',
  'otherDocuments'
];

const FILE_COLUMN = {
  birthCertificate: 'birth_certificate',
  photograph: 'photograph',
  fatherQualificationProof: 'father_qualification_proof',
  motherQualificationProof: 'mother_qualification_proof',
  fatherOccupationProof: 'father_occupation_proof',
  motherOccupationProof: 'mother_occupation_proof',
  incomeCertificate: 'income_certificate',
  addressProof: 'address_proof',
  otherDocuments: 'other_documents'
};

const allowed = /\.(pdf|jpe?g|png|webp)$/i;

export const studentUpload = multer({
  dest: tmpUploadsRoot,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (allowed.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF, JPG, PNG or WEBP files are allowed.'));
  }
});

export const studentFileFields = studentUpload.fields(
  FILE_FIELDS.map((name) => ({ name, maxCount: 1 }))
);

export const mentorFileFields = studentUpload.fields([{ name: 'photo', maxCount: 1 }]);
export const alumniFileFields = studentUpload.fields([{ name: 'photo', maxCount: 1 }]);
export const galleryFileFields = studentUpload.array('images', 10);
export const gallerySingleFile = studentUpload.fields([{ name: 'image', maxCount: 1 }]);

function moveUpload(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) {
    fs.unlinkSync(to);
  }
  try {
    fs.renameSync(from, to);
  } catch {
    fs.copyFileSync(from, to);
    if (fs.existsSync(from)) fs.unlinkSync(from);
  }
}

function removePreviousFiles(dir, column) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === column || name.startsWith(`${column}.`) || name.startsWith(`${column}_`)) {
      try {
        fs.unlinkSync(path.join(dir, name));
      } catch {
        // ignore locked files
      }
    }
  }
}

export function saveStudentFiles(files, studentCode) {
  const saved = {};
  if (!files) return saved;

  const dir = path.join(studentUploadsRoot, studentCode);
  fs.mkdirSync(dir, { recursive: true });

  for (const field of FILE_FIELDS) {
    const uploaded = files[field]?.[0];
    if (!uploaded) continue;
    const column = FILE_COLUMN[field];
    const ext = path.extname(uploaded.originalname).toLowerCase() || '.bin';
    removePreviousFiles(dir, column);
    const filename = `${column}_${Date.now()}${ext}`;
    const dest = path.join(dir, filename);
    moveUpload(uploaded.path, dest);
    saved[column] = `/uploads/students/${studentCode}/${filename}`;
  }

  return saved;
}

export function saveMentorFiles(files, mentorCode) {
  const saved = {};
  const uploaded = files?.photo?.[0];
  if (!uploaded) return saved;

  const dir = path.join(mentorUploadsRoot, mentorCode);
  fs.mkdirSync(dir, { recursive: true });
  removePreviousFiles(dir, 'photo');
  const ext = path.extname(uploaded.originalname).toLowerCase() || '.jpg';
  const filename = `photo_${Date.now()}${ext}`;
  moveUpload(uploaded.path, path.join(dir, filename));
  saved.photo = `/uploads/mentors/${mentorCode}/${filename}`;
  return saved;
}

export function saveAlumniFiles(files, alumniCode) {
  const saved = {};
  const uploaded = files?.photo?.[0];
  if (!uploaded) return saved;

  const dir = path.join(alumniUploadsRoot, alumniCode);
  fs.mkdirSync(dir, { recursive: true });
  removePreviousFiles(dir, 'photo');
  const ext = path.extname(uploaded.originalname).toLowerCase() || '.jpg';
  const filename = `photo_${Date.now()}${ext}`;
  moveUpload(uploaded.path, path.join(dir, filename));
  saved.photo = `/uploads/alumni/${alumniCode}/${filename}`;
  return saved;
}

export function saveGalleryFiles(files, codes) {
  const saved = [];
  const list = Array.isArray(files) ? files : [];
  list.forEach((uploaded, index) => {
    if (!uploaded) return;
    const code = codes[index];
    if (!code) return;
    const ext = path.extname(uploaded.originalname).toLowerCase() || '.jpg';
    const filename = `${code}_${Date.now()}_${index}${ext}`;
    moveUpload(uploaded.path, path.join(galleryUploadsRoot, filename));
    saved.push(`/uploads/gallery/${filename}`);
  });
  return saved;
}

export function saveGalleryImage(files, code) {
  const uploaded = files?.image?.[0];
  if (!uploaded) return {};
  const ext = path.extname(uploaded.originalname).toLowerCase() || '.jpg';
  const filename = `${code}_${Date.now()}${ext}`;
  moveUpload(uploaded.path, path.join(galleryUploadsRoot, filename));
  return { image_path: `/uploads/gallery/${filename}` };
}

export function cleanupFileArray(files) {
  if (!files) return;
  const list = Array.isArray(files) ? files : Object.values(files).flat();
  for (const file of list || []) {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}

export function cleanupTempFiles(files) {
  if (!files) return;
  for (const list of Object.values(files)) {
    for (const file of list || []) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}
