import express from 'express';
import {
  addFavorite,
  getUserFavorites,
  removeFavorite,
  getAllFavorites,
} from '../controllers/favoriteController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticate, addFavorite);
router.get('/user/favorites', authenticate, getUserFavorites);
router.get('/', authenticate, authorize(['admin']), getAllFavorites);
router.delete('/:hallId', authenticate, removeFavorite);

export default router;
