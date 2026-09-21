import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  mySessions,
  createSession,
  updateSession,
  deleteSession,
  myStudents,
  batchAttendance,
  saveBatchAttendance,
  myAssignmentsWithSubmissions,
  gradeSubmission,
  listMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  listAnnouncements,
  createAnnouncement,
  myReports
} from '../controllers/mentorPortal.controller.js';

const router = Router();

router.use(requireAuth, requireRole('staff', 'admin'));

router.get('/sessions', mySessions);
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

router.get('/students', myStudents);

router.get('/attendance/batch', batchAttendance);
router.post('/attendance/batch', saveBatchAttendance);

router.get('/assignments', myAssignmentsWithSubmissions);
router.put('/submissions/:id/grade', gradeSubmission);

router.get('/materials', listMaterials);
router.post('/materials', createMaterial);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);

router.get('/announcements', listAnnouncements);
router.post('/announcements', createAnnouncement);

router.get('/reports', myReports);

export default router;
