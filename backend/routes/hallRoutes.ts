import express from 'express';
import { getAllHalls, getHallById, createHall, updateHall, deleteHall, addHallImages, getHallAvailability, getMyHalls, getMyRequests } from '../controllers/hallController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Barcha to'yxonalar olish
router.get('/', getAllHalls);

// Ownerning o'ziga tegishli to'yxonalarini va so'rovlarini olish
router.get('/my-halls', authenticate, authorize(['owner']), getMyHalls);
router.get('/my-requests', authenticate, authorize(['owner']), getMyRequests);

// To'yxona ID bo'yicha olish
router.get('/:hallId', getHallById);

// To'yxona bo'sh sanalarini olish
router.get('/:hallId/availability', getHallAvailability);

// To'yxona yaratish (owner va admin)
router.post('/', authenticate, authorize(['owner', 'admin']), createHall);

// To'yxona yangilash (owner va admin)
router.put('/:hallId', authenticate, authorize(['owner', 'admin']), updateHall);

// To'yxona o'chirish (owner va admin)
router.delete('/:hallId', authenticate, authorize(['owner', 'admin']), deleteHall);

// To'yxona rasmlarini qo'shish
router.post('/:hallId/images', authenticate, authorize(['owner', 'admin']), addHallImages);

export default router;
