import express from 'express';
import {
  getCars,
  createCar,
  updateCar,
  deleteCar,
} from '../controllers/carsController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getCars);
router.post('/', authenticate, authorize(['admin']), createCar);
router.patch('/:id', authenticate, authorize(['admin']), updateCar);
router.delete('/:id', authenticate, authorize(['admin']), deleteCar);

export default router;
