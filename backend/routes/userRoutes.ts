import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getAllUsers,
  becomeOwner,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/become-owner', authenticate, becomeOwner);
router.get('/all', authenticate, authorize(['admin']), getAllUsers);

export default router;
