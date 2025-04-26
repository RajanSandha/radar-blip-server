import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// Settings routes
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);

export default router; 