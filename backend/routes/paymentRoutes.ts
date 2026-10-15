import express from 'express';
import {
  createPayment,
  getUserPayments,
  updatePaymentStatus,
  getAllPayments,
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticate, createPayment);
router.get('/user/payments', authenticate, getUserPayments);
router.get('/', authenticate, authorize(['admin']), getAllPayments);
router.put('/:paymentId', authenticate, authorize(['admin']), updatePaymentStatus);

export default router;
