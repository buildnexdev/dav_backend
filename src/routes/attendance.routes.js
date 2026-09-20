import { Router } from 'express';
import {
  listAttendance,
  getAttendance,
  getBatchAttendance,
  saveBatchAttendance,
  markOneAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendance.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/', listAttendance);
router.get('/batch', getBatchAttendance);
router.post('/batch', saveBatchAttendance);
router.post('/mark', markOneAttendance);
router.get('/:id', getAttendance);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);
export default router;
