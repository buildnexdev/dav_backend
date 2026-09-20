import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  getPaymentConfig,
  listPayments,
  createOrder,
  verifyPayment,
  markPaymentFailed,
  deletePayment
} from '../controllers/payment.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, env.jwtSecret);
  } catch {
    req.user = null;
  }
  next();
}

router.get('/config', getPaymentConfig);
router.post('/order', optionalAuth, createOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.get('/', requireAuth, requireRole('admin', 'student'), listPayments);
router.post('/:id/fail', requireAuth, requireRole('admin', 'student'), markPaymentFailed);
router.delete('/:id', requireAuth, requireRole('admin'), deletePayment);

export default router;
