import { Router } from 'express';
import { adminDashboard, studentDashboard, staffDashboard } from '../controllers/dashboard.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/admin', requireAuth, requireRole('admin'), adminDashboard);
router.get('/student', requireAuth, requireRole('student'), studentDashboard);
router.get('/staff', requireAuth, requireRole('admin', 'staff'), staffDashboard);
export default router;
