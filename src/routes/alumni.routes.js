import { Router } from 'express';
import {
  listAlumni,
  getAlumni,
  createAlumni,
  updateAlumni,
  setAlumniStatus,
  deleteAlumni
} from '../controllers/alumni.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { alumniFileFields } from '../middleware/upload.js';

const router = Router();

function withFiles(req, res, next) {
  alumniFileFields(req, res, (err) => {
    if (!err) return next();
    err.status = 400;
    next(err);
  });
}

router.use(requireAuth, requireRole('admin'));
router.get('/', listAlumni);
router.get('/:id', getAlumni);
router.post('/', withFiles, createAlumni);
router.put('/:id', withFiles, updateAlumni);
router.patch('/:id/status', setAlumniStatus);
router.delete('/:id', deleteAlumni);
export default router;
