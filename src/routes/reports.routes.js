import { Router } from 'express';
import { getReport, listReportModules } from '../controllers/reports.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/modules', listReportModules);
router.get('/:module', getReport);
export default router;
