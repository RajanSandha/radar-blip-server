import { Response } from 'express';
import Chat from '../models/Chat';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all chats for current user
 * @route GET /api/chats
 * @access Private
 */
export const getChats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Find all chats where user is a participant
    const chats = await Chat.find({
      participants: req.user?._id
    })
      .populate('participants', 'name avatar isOnline lastActive')
      .sort('-updatedAt');
    
    // Format chats for front-end
    const formattedChats = chats.map(chat => {
      // Find the other participant (not the current user)
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== req.user?._id.toString()
      );
      
      return {
        id: chat._id,
        user: otherParticipant,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt
      };
    });
    
    res.json({
      success: true,
      count: chats.length,
      data: formattedChats
    });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      message = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: message
    });
  }
};

/**
 * Get single chat or create new one
 * @route GET /api/chats/:userId
 * @access Private
 */
export const getOrCreateChat = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    // Validate user exists
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    // Find existing chat
    let chat = await Chat.findOne({
      participants: {
        $all: [req.user?._id, userId]
      }
    }).populate('participants', 'name avatar isOnline lastActive');
    
    // If no chat exists, create a new one
    if (!chat) {
      chat = await Chat.create({
        participants: [req.user?._id, userId],
        messages: []
      });
      
      // Populate participants
      chat = await Chat.findById(chat._id).populate('participants', 'name avatar isOnline lastActive');
    }
    
    // Format response
    const otherParticipant = chat?.participants.find(
      p => p._id.toString() !== req.user?._id.toString()
    );
    
    res.json({
      success: true,
      data: {
        id: chat?._id,
        user: otherParticipant,
        messages: chat?.messages || [],
        lastMessage: chat?.lastMessage
      }
    });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      message = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: message
    });
  }
};

/**
 * Send message in a chat
 * @route POST /api/chats/:chatId/messages
 * @access Private
 */
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { content } = req.body;
    const chatId = req.params.chatId;
    
    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Please provide message content'
      });
      return;
    }
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
      return;
    }
    
    // Check if user is a participant
    if (!chat.participants.includes(req.user?._id)) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to send messages in this chat'
      });
      return;
    }
    
    // Create new message
    const newMessage = {
      sender: req.user?._id,
      content,
      timestamp: new Date(),
      read: false
    };
    
    // Add to messages array
    chat.messages.push(newMessage);
    
    // Update last message
    chat.lastMessage = newMessage;
    
    // Save chat
    await chat.save();
    
    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      message = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: message
    });
  }
};

/**
 * Mark messages as read
 * @route PUT /api/chats/:chatId/read
 * @access Private
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const chatId = req.params.chatId;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
      return;
    }
    
    // Check if user is a participant
    if (!chat.participants.includes(req.user?._id)) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this chat'
      });
      return;
    }
    
    // Mark all messages from other user as read
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user?._id.toString()) {
        message.read = true;
      }
    });
    
    // Save chat
    await chat.save();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      message = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: message
    });
  }
}; 