import { Router } from 'express';
import { getNearbyUsers } from '../controllers/radar.controller';
import { protect } from '../middleware/auth';
import { updateLocation } from '../middleware/location';

const router = Router();

// All radar routes are protected
router.use(protect);

// Update location before processing radar requests
router.use(updateLocation);

// Get nearby users
router.get('/nearby', getNearbyUsers);

export default router; 