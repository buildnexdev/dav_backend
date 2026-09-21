import { Router } from 'express';
import { listPublicAlumni } from '../controllers/alumni.controller.js';
import { listPublicGallery } from '../controllers/gallery.controller.js';
import { listPublicNews } from '../controllers/news.controller.js';
import { listPublicNotifications } from '../controllers/notification.controller.js';
import { createApplication, trackApplication } from '../controllers/application.controller.js';
import { listPublicMentors } from '../controllers/mentor.controller.js';

const router = Router();
router.get('/alumni', listPublicAlumni);
router.get('/gallery', listPublicGallery);
router.get('/news', listPublicNews);
router.get('/notifications', listPublicNotifications);
router.get('/mentors', listPublicMentors);
router.post('/applications', createApplication);
router.get('/applications/track', trackApplication);
export default router;
