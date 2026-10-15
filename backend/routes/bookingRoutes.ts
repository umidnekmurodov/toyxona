import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
  getOwnerBookings,
  getOwnerStats,
} from '../controllers/bookingController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// ⚠️ Eslatma: Aniq yo'llar parametrli /:bookingId dan oldin bo'lishi shart
router.get('/owner/bookings', authenticate, authorize(['owner']), getOwnerBookings);
router.get('/owner/stats', authenticate, authorize(['owner']), getOwnerStats);
router.get('/user/bookings', authenticate, getUserBookings);
router.get('/', authenticate, authorize(['admin']), getAllBookings);
router.post('/', authenticate, createBooking);

router.get('/:bookingId', authenticate, getBookingById);
router.put('/:bookingId/status', authenticate, authorize(['owner', 'admin']), updateBookingStatus);
router.put('/:bookingId/cancel', authenticate, cancelBooking);

export default router;
