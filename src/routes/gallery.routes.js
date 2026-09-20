import { Router } from 'express';
import {
  listGallery,
  createGallery,
  updateGallery,
  setGalleryStatus,
  deleteGallery
} from '../controllers/gallery.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { galleryFileFields, gallerySingleFile } from '../middleware/upload.js';

const router = Router();

function withMany(req, res, next) {
  galleryFileFields(req, res, (err) => {
    if (!err) return next();
    err.status = 400;
    next(err);
  });
}

function withOne(req, res, next) {
  gallerySingleFile(req, res, (err) => {
    if (!err) return next();
    err.status = 400;
    next(err);
  });
}

router.use(requireAuth, requireRole('admin'));
router.get('/', listGallery);
router.post('/', withMany, createGallery);
router.put('/:id', withOne, updateGallery);
router.patch('/:id/status', setGalleryStatus);
router.delete('/:id', deleteGallery);
export default router;
