import { Router } from 'express';
import {
  listMentors,
  getMentor,
  createMentor,
  updateMentor,
  deleteMentor
} from '../controllers/mentor.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { mentorFileFields } from '../middleware/upload.js';

const router = Router();

function withFiles(req, res, next) {
  mentorFileFields(req, res, (err) => {
    if (!err) return next();
    err.status = 400;
    next(err);
  });
}

router.use(requireAuth, requireRole('admin'));
router.get('/', listMentors);
router.get('/:id', getMentor);
router.post('/', withFiles, createMentor);
router.put('/:id', withFiles, updateMentor);
router.delete('/:id', deleteMentor);

export default router;
