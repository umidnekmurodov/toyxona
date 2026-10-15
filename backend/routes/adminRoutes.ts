import express from 'express';
import {
  getAllUsersAdmin,
  blockUser,
  deleteUser,
  approveHall,
  deleteHallAdmin,
  getAllHallsAdmin,
  getAllOwners,
  getStats,
  getHallRequests,
  approveHallRequest,
  rejectHallRequest,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Barcha admin yo'llari faqat admin roli uchun
router.use(authenticate, authorize(['admin']));

router.get('/stats', getStats);
router.get('/users', getAllUsersAdmin);
router.put('/users/:userId/block', blockUser);
router.delete('/users/:userId', deleteUser);

router.get('/owners', getAllOwners);
router.get('/halls', getAllHallsAdmin);
router.put('/halls/:hallId/approve', approveHall);
router.delete('/halls/:hallId', deleteHallAdmin);

router.get('/hall-requests', getHallRequests);
router.put('/hall-requests/:requestId/approve', approveHallRequest);
router.put('/hall-requests/:requestId/reject', rejectHallRequest);

export default router;
