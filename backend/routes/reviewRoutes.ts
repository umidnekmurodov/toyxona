import express from 'express';
import {
  createReview,
  getHallReviews,
  updateReview,
  deleteReview,
  getUserReviews,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticate, createReview);
router.get('/hall/:hallId', getHallReviews);
router.get('/', authenticate, getUserReviews);
router.put('/:reviewId', authenticate, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);

export default router;
