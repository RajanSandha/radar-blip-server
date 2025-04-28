import { Router } from 'express';
import { getNearbyUsers, updateLocation } from '../controllers/radar.controller';
import { protect } from '../middleware/auth';

const router = Router();

// All radar routes are protected
router.use(protect);

// Update user location
router.post('/location', updateLocation);

// Get nearby users
router.get('/nearby', getNearbyUsers);

export default router; 