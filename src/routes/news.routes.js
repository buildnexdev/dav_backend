import { Router } from 'express';
import {
  listNews,
  getNews,
  createNews,
  updateNews,
  setNewsStatus,
  deleteNews
} from '../controllers/news.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/', listNews);
router.get('/:id', getNews);
router.post('/', createNews);
router.put('/:id', updateNews);
router.patch('/:id/status', setNewsStatus);
router.delete('/:id', deleteNews);
export default router;
