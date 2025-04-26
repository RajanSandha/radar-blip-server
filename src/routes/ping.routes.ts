import { Router } from 'express';
import { sendPing, respondToPing, getPings, deletePing } from '../controllers/ping.controller';
import { protect } from '../middleware/auth';

const router = Router();

// All ping routes are protected
router.use(protect);

// Get all pings
router.get('/', getPings);

// Send a ping
router.post('/send', sendPing);

// Respond to ping (accept/decline)
router.put('/:id/respond', respondToPing);

// Delete/cancel a ping
router.delete('/:id', deletePing);

export default router; 