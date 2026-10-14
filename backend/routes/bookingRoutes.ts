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
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// ✅ FIX [BUG-010]: CRITICAL — specific routes MUST come before /:param routes
// Otherwise Express matches /owner/bookings as bookingId="owner"

// Owner routes (SPECIFIC — must be BEFORE /:bookingId)
router.get('/owner/bookings', authenticate, authorize(['owner']), getOwnerBookings);
router.get('/owner/stats', authenticate, authorize(['owner']), getOwnerStats);

// User routes
router.get('/user/bookings', authenticate, getUserBookings);

// Barcha bookinglar (admin) — SPECIFIC, must be before /:bookingId too
// Actually GET '/' conflicts with nothing, but keep it here for clarity
router.get('/', authenticate, authorize(['admin']), getAllBookings);

// Booking yaratish
router.post('/', authenticate, createBooking);

// ⚠️ GENERIC param routes LAST
router.get('/:bookingId', authenticate, getBookingById);
router.put('/:bookingId/status', authenticate, authorize(['owner', 'admin']), updateBookingStatus);
router.put('/:bookingId/cancel', authenticate, cancelBooking);

export default router;
