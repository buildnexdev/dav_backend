import { Router } from 'express';
import { getMyAccess, getSettings, updateSettings } from '../controllers/settings.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAuth, getSettings);
router.get('/me', requireAuth, getMyAccess);
router.put('/', requireAuth, requireRole('admin'), updateSettings);
export default router;
