import express from 'express';
import { getCars, createCar, updateCar, deleteCar } from '../controllers/carsController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public
router.get('/', getCars);

// Admin only
router.post('/', authenticate, authorize(['admin']), createCar);
router.patch('/:id', authenticate, authorize(['admin']), updateCar);
router.delete('/:id', authenticate, authorize(['admin']), deleteCar);

export default router;
