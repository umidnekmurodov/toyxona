import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { 
  getAllUsersAdmin, 
  blockUser, 
  approveHall, 
  getStats, 
  deleteUser, 
  deleteHallAdmin,
  getHallRequests,
  approveHallRequest,
  rejectHallRequest,
  getAllHallsAdmin,
  getAllOwners
} from '../controllers/adminController';

const router = express.Router();

router.use(authenticate, authorize(['admin']));

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

router.get('/stats', getStats);

export default router;
