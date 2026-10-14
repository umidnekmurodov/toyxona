import express from 'express';
import { registerUser, loginUser, getProfile, updateProfile, getAllUsers, becomeOwner } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Ro'yxatdan o'tish
router.post('/register', registerUser);

// Kirish
router.post('/login', loginUser);

// Profil olish
router.get('/profile', authenticate, getProfile);

// Profil yangilash
router.put('/profile', authenticate, updateProfile);

// Owner bo'lish uchun so'rov yuborish
router.post('/become-owner', authenticate, becomeOwner);

// Barcha foydalanuvchilar (admin)
router.get('/all', authenticate, authorize(['admin']), getAllUsers);

export default router;
