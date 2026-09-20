import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextCode } from '../db/codes.js';

const STATUSES = ['Created', 'Pending', 'Completed', 'Failed'];
export const FEE_CATEGORIES = ['Application Fee', 'Program Fee', 'Hostel Fee', 'Test Series Fee', 'Other'];
const APPLICATION_FEE = 500;

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function toAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function razorpayClient() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) return null;
  return new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret
  });
}

export function mapPayment(row) {
  return {
    id: row.id,
    paymentCode: row.payment_code,
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    studentCode: row.student_code || '',
    payerName: row.payer_name || row.student_name || '',
    email: row.email || '',
    phone: row.phone || '',
    category: row.category,
    amount: Number(row.amount),
    currency: row.currency || 'INR',
    method: row.method || 'Razorpay',
    razorpayOrderId: row.razorpay_order_id || '',
    razorpayPaymentId: row.razorpay_payment_id || '',
    receipt: row.receipt || '',
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at || ''
  };
}

const SELECT_SQL = `
  SELECT p.*, s.name AS student_name, s.student_code
  FROM payments p
  LEFT JOIN students s ON s.id = p.student_id
`;

export const getPaymentConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    keyId: env.razorpay.keyId,
    testMode: String(env.razorpay.keyId || '').startsWith('rzp_test_'),
    currency: 'INR',
    applicationFee: APPLICATION_FEE,
    categories: FEE_CATEGORIES
  });
});

export const listPayments = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const clauses = [];
  const params = [];

  if (req.user?.role === 'student') {
    clauses.push('s.user_id = ?');
    params.push(req.user.id);
  }

  if (search) {
    clauses.push('(p.payment_code LIKE ? OR p.payer_name LIKE ? OR p.email LIKE ? OR s.name LIKE ? OR p.razorpay_payment_id LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  if (STATUSES.includes(status)) {
    clauses.push('p.status = ?');
    params.push(status);
  }

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${SELECT_SQL}${where} ORDER BY p.id DESC`, params);
  res.json({ success: true, payments: rows.map(mapPayment) });
});

export const createOrder = asyncHandler(async (req, res) => {
  const category = String(req.body.category || 'Program Fee').trim();
  let amount = toAmount(req.body.amount);
  let studentId = req.body.studentId ? Number(req.body.studentId) : null;
  let payerName = emptyToNull(req.body.payerName);
  let email = emptyToNull(req.body.email);
  let phone = emptyToNull(req.body.phone);

  if (req.user?.role === 'student') {
    const [mine] = await pool.query('SELECT id, name, email, phone FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (!mine.length) return res.status(404).json({ success: false, error: 'No student profile is linked to this login.' });
    studentId = mine[0].id;
    payerName = payerName || mine[0].name;
    email = email || mine[0].email;
    phone = phone || mine[0].phone;
  }

  const isGuest = !req.user;
  if (isGuest) {
    if (category !== 'Application Fee') {
      return res.status(403).json({ success: false, error: 'Sign in to pay program fees.' });
    }
    amount = APPLICATION_FEE;
  }

  if (!amount) return res.status(400).json({ success: false, error: 'Enter a valid amount.' });
  if (studentId) {
    const [students] = await pool.query('SELECT id, name, email, phone FROM students WHERE id = ? LIMIT 1', [studentId]);
    if (!students.length) return res.status(404).json({ success: false, error: 'Student not found.' });
    payerName = payerName || students[0].name;
    email = email || students[0].email;
    phone = phone || students[0].phone;
  }

  const code = await nextCode(pool, 'payments', 'payment_code', 'PAY');
  const receipt = code;
  const paise = Math.round(amount * 100);
  let razorpayOrderId = null;
  let status = 'Created';

  const client = razorpayClient();
  if (client) {
    try {
      const order = await client.orders.create({
        amount: paise,
        currency: 'INR',
        receipt,
        notes: { paymentCode: code, category, studentId: studentId ? String(studentId) : '' }
      });
      razorpayOrderId = order.id;
      status = 'Pending';
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err?.error?.description || err.message || 'Could not create Razorpay test order. Check the test API keys.'
      });
    }
  }

  const [result] = await pool.query(
    `INSERT INTO payments
      (payment_code, student_id, payer_name, email, phone, category, amount, currency, method, razorpay_order_id, receipt, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'Razorpay', ?, ?, ?, ?)`,
    [code, studentId, payerName, email, phone, category, amount, razorpayOrderId, receipt, status, emptyToNull(req.body.notes)]
  );

  const [rows] = await pool.query(`${SELECT_SQL} WHERE p.id = ?`, [result.insertId]);
  res.status(201).json({
    success: true,
    keyId: env.razorpay.keyId,
    orderId: razorpayOrderId,
    amountPaise: paise,
    payment: mapPayment(rows[0])
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const paymentId = Number(req.body.paymentId);
  const razorpayOrderId = String(req.body.razorpay_order_id || req.body.razorpayOrderId || '');
  const razorpayPaymentId = String(req.body.razorpay_payment_id || req.body.razorpayPaymentId || '');
  const razorpaySignature = String(req.body.razorpay_signature || req.body.razorpaySignature || '');

  if (!paymentId || !razorpayPaymentId) {
    return res.status(400).json({ success: false, error: 'Payment verification details are missing.' });
  }

  const [existing] = await pool.query(`${SELECT_SQL} WHERE p.id = ? LIMIT 1`, [paymentId]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Payment record not found.' });

  if (env.razorpay.keySecret) {
    const expected = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (expected !== razorpaySignature) {
      await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['Failed', paymentId]);
      return res.status(400).json({ success: false, error: 'Razorpay signature verification failed.' });
    }
  }

  await pool.query(
    `UPDATE payments
     SET status = 'Completed', method = 'Razorpay',
         razorpay_order_id = COALESCE(NULLIF(?, ''), razorpay_order_id),
         razorpay_payment_id = ?, razorpay_signature = ?
     WHERE id = ?`,
    [razorpayOrderId, razorpayPaymentId, razorpaySignature || null, paymentId]
  );

  const [rows] = await pool.query(`${SELECT_SQL} WHERE p.id = ?`, [paymentId]);
  res.json({ success: true, payment: mapPayment(rows[0]) });
});

export const markPaymentFailed = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM payments WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Payment record not found.' });
  await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['Failed', req.params.id]);
  const [rows] = await pool.query(`${SELECT_SQL} WHERE p.id = ?`, [req.params.id]);
  res.json({ success: true, payment: mapPayment(rows[0]) });
});

export const deletePayment = asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM payments WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, error: 'Payment record not found.' });
  await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Payment record deleted.' });
});
