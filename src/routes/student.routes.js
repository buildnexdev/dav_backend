import { Router } from 'express';
import {
  listStudents,
  getStudent,
  getMyStudent,
  createStudent,
  updateStudent,
  updateMyStudent,
  deleteStudent
} from '../controllers/student.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { studentFileFields } from '../middleware/upload.js';

const router = Router();

function withFiles(req, res, next) {
  studentFileFields(req, res, (err) => {
    if (!err) return next();
    err.status = 400;
    next(err);
  });
}

router.get('/me', requireAuth, requireRole('admin', 'student'), getMyStudent);
router.put('/me', requireAuth, requireRole('student'), withFiles, updateMyStudent);

router.get('/', requireAuth, requireRole('admin'), listStudents);
router.get('/:id', requireAuth, requireRole('admin'), getStudent);
router.post('/', requireAuth, requireRole('admin'), withFiles, createStudent);
router.put('/:id', requireAuth, requireRole('admin'), withFiles, updateStudent);
router.delete('/:id', requireAuth, requireRole('admin'), deleteStudent);

export default router;
