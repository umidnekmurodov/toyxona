import express from 'express';
import { createReview, getHallReviews, updateReview, deleteReview, getUserReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Sharh yaratish
router.post('/', authenticate, createReview);

// To'yxona uchun sharhlar olish
router.get('/hall/:hallId', getHallReviews);

// Foydalanuvchining o'z sharhlarini olish (USER DASHBOARD UCHUN)
router.get('/', authenticate, getUserReviews);

// Sharh yangilash
router.put('/:reviewId', authenticate, updateReview);

// Sharh o'chirish
router.delete('/:reviewId', authenticate, deleteReview);

export default router;
