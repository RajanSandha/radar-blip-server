import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { 
  sendConnectionRequest, 
  blockUser,
  reportUser
} from '../controllers/user.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// Settings routes
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);

// Connection routes
router.post('/connections/request/:userId', protect, sendConnectionRequest);

// Block user route
router.post('/block/:userId', protect, blockUser);

// Report user route
router.post('/report/:userId', protect, reportUser);

export default router; 