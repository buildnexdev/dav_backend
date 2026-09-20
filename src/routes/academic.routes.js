import { Router } from 'express';
import {
  listAcademics,
  getAcademic,
  createAcademic,
  updateAcademic,
  deleteAcademic
} from '../controllers/academic.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/', listAcademics);
router.get('/:id', getAcademic);
router.post('/', createAcademic);
router.put('/:id', updateAcademic);
router.delete('/:id', deleteAcademic);
export default router;
