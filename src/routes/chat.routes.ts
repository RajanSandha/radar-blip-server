import { Router } from 'express';
import { getChats, getOrCreateChat, sendMessage, markAsRead } from '../controllers/chat.controller';
import { protect } from '../middleware/auth';

const router = Router();

// All chat routes are protected
router.use(protect);

// Get all chats
router.get('/', getChats);

// Get or create chat with specific user
router.get('/:userId', getOrCreateChat);

// Send message in chat
router.post('/:chatId/messages', sendMessage);

// Mark messages as read
router.put('/:chatId/read', markAsRead);

export default router; 