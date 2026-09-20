import { Router } from 'express';
import {
  listNotifications,
  getNotification,
  createNotification,
  updateNotification,
  setNotificationStatus,
  deleteNotification
} from '../controllers/notification.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/', listNotifications);
router.get('/:id', getNotification);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.patch('/:id/status', setNotificationStatus);
router.delete('/:id', deleteNotification);
export default router;
