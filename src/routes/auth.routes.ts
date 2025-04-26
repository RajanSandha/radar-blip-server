import { Router } from 'express';
import { register, login, getMe, updateProfile, logout } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

export default router; 