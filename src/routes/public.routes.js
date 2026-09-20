import { Router } from 'express';
import { listPublicAlumni } from '../controllers/alumni.controller.js';
import { listPublicGallery } from '../controllers/gallery.controller.js';
import { listPublicNews } from '../controllers/news.controller.js';
import { listPublicNotifications } from '../controllers/notification.controller.js';

const router = Router();
router.get('/alumni', listPublicAlumni);
router.get('/gallery', listPublicGallery);
router.get('/news', listPublicNews);
router.get('/notifications', listPublicNotifications);
export default router;
