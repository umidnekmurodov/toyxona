import express from 'express';
import { addFavorite, getUserFavorites, removeFavorite, getAllFavorites } from '../controllers/favoriteController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Sevimli qo'shish
router.post('/', authenticate, addFavorite);

// Foydalanuvchining sevimli to'yxonalari
router.get('/user/favorites', authenticate, getUserFavorites);

// Sevimlilardan o'chirish
router.delete('/:hallId', authenticate, removeFavorite);

// Barcha sevimlilar (admin)
router.get('/', authenticate, authorize(['admin']), getAllFavorites);

export default router;
