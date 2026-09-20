import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const backendRoot = path.resolve(__dirname, '../..');
export const uploadsRoot = path.join(backendRoot, 'uploads');
export const studentUploadsRoot = path.join(uploadsRoot, 'students');
export const mentorUploadsRoot = path.join(uploadsRoot, 'mentors');
export const alumniUploadsRoot = path.join(uploadsRoot, 'alumni');
export const galleryUploadsRoot = path.join(uploadsRoot, 'gallery');
export const tmpUploadsRoot = path.join(uploadsRoot, 'tmp');
