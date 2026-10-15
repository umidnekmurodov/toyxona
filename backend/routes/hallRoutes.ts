import express from 'express';
import {
  getAllHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
  addHallImages,
  getHallAvailability,
  getMyHalls,
  getMyRequests,
} from '../controllers/hallController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getAllHalls);
router.get('/my-halls', authenticate, authorize(['owner']), getMyHalls);
router.get('/my-requests', authenticate, authorize(['owner']), getMyRequests);
router.get('/:hallId', getHallById);
router.get('/:hallId/availability', getHallAvailability);
router.post('/', authenticate, authorize(['owner', 'admin']), createHall);
router.put('/:hallId', authenticate, authorize(['owner', 'admin']), updateHall);
router.delete('/:hallId', authenticate, authorize(['owner', 'admin']), deleteHall);
router.post('/:hallId/images', authenticate, authorize(['owner', 'admin']), addHallImages);

export default router;
