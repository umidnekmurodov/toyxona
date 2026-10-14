import express from 'express';
import { getSingers, createSinger, updateSinger, deleteSinger } from '../controllers/singersController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public
router.get('/', getSingers);

// Admin only
router.post('/', authenticate, authorize(['admin']), createSinger);
router.patch('/:id', authenticate, authorize(['admin']), updateSinger);
router.delete('/:id', authenticate, authorize(['admin']), deleteSinger);

export default router;
