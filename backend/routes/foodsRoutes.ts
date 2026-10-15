import express from 'express';
import {
  getFoods,
  createFood,
  updateFood,
  deleteFood,
} from '../controllers/foodsController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getFoods);
router.post('/', authenticate, authorize(['admin']), createFood);
router.patch('/:id', authenticate, authorize(['admin']), updateFood);
router.delete('/:id', authenticate, authorize(['admin']), deleteFood);

export default router;
