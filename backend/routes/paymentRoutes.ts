import express from 'express';
import { createPayment, getUserPayments, updatePaymentStatus, getAllPayments } from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// To'lov yaratish
router.post('/', authenticate, createPayment);

// Foydalanuvchining to'lovlari
router.get('/user/payments', authenticate, getUserPayments);

// To'lovni yangilash (paid qilish)
router.put('/:paymentId', authenticate, authorize(['admin']), updatePaymentStatus);

// Barcha to'lovlar (admin)
router.get('/', authenticate, authorize(['admin']), getAllPayments);

export default router;
