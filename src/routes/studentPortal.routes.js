import { Router } from 'express';
import multer from 'multer';
import { tmpUploadsRoot } from '../config/paths.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  myTimetable,
  myTests,
  myAssignments,
  submitAssignment,
  myAttendance,
  myAnnouncements,
  myScholarship,
  myMaterials,
  myResults,
  myCurrentAffairs,
  listMaterialsAdmin,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  listResultsAdmin,
  createResult,
  updateResult,
  deleteResult
} from '../controllers/studentPortal.controller.js';

const upload = multer({
  dest: tmpUploadsRoot,
  limits: { fileSize: 8 * 1024 * 1024 }
});

const router = Router();

router.get('/timetable', requireAuth, requireRole('student'), myTimetable);
router.get('/tests', requireAuth, requireRole('student'), myTests);
router.get('/assignments', requireAuth, requireRole('student'), myAssignments);
router.post('/assignments/:id/submit', requireAuth, requireRole('student'), upload.single('file'), submitAssignment);
router.get('/attendance', requireAuth, requireRole('student'), myAttendance);
router.get('/announcements', requireAuth, requireRole('student'), myAnnouncements);
router.get('/scholarship', requireAuth, requireRole('student'), myScholarship);
router.get('/materials', requireAuth, requireRole('student'), myMaterials);
router.get('/results', requireAuth, requireRole('student'), myResults);
router.get('/current-affairs', requireAuth, requireRole('student'), myCurrentAffairs);

router.get('/admin/materials', requireAuth, requireRole('admin'), listMaterialsAdmin);
router.post('/admin/materials', requireAuth, requireRole('admin'), createMaterial);
router.put('/admin/materials/:id', requireAuth, requireRole('admin'), updateMaterial);
router.delete('/admin/materials/:id', requireAuth, requireRole('admin'), deleteMaterial);

router.get('/admin/results', requireAuth, requireRole('admin'), listResultsAdmin);
router.post('/admin/results', requireAuth, requireRole('admin'), createResult);
router.put('/admin/results/:id', requireAuth, requireRole('admin'), updateResult);
router.delete('/admin/results/:id', requireAuth, requireRole('admin'), deleteResult);

export default router;
