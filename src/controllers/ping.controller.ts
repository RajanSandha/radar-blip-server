import { Response } from 'express';
import Ping from '../models/Ping';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Send a ping to another user
 * @route POST /api/pings/send
 * @access Private
 */
export const sendPing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, message, distance } = req.body;
    
    // Validate request
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'Please provide a user ID'
      });
      return;
    }
    
    // Check if user exists
    const receiver = await User.findById(userId);
    
    if (!receiver) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    // Check if ping already exists
    const existingPing = await Ping.findOne({
      sender: req.user?._id,
      receiver: userId,
      status: 'pending'
    });
    
    if (existingPing) {
      res.status(400).json({
        success: false,
        error: 'You already have a pending ping to this user'
      });
      return;
    }
    
    // Create ping
    const ping = await Ping.create({
      sender: req.user?._id,
      receiver: userId,
      message: message || '',
      distance: distance || 0
    });
    
    res.status(201).json({
      success: true,
      data: ping
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
 * Respond to a ping (accept or decline)
 * @route PUT /api/pings/:id/respond
 * @access Private
 */
export const respondToPing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { response } = req.body;
    
    if (response !== 'accepted' && response !== 'declined') {
      res.status(400).json({
        success: false,
        error: 'Response must be either "accepted" or "declined"'
      });
      return;
    }
    
    const ping = await Ping.findById(req.params.id);
    
    if (!ping) {
      res.status(404).json({
        success: false,
        error: 'Ping not found'
      });
      return;
    }
    
    // Ensure ping is directed to current user
    if (ping.receiver.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to respond to this ping'
      });
      return;
    }
    
    // Update ping status
    ping.status = response;
    await ping.save();
    
    res.json({
      success: true,
      data: ping
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
 * Get all pings for current user (sent and received)
 * @route GET /api/pings
 * @access Private
 */
export const getPings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get pings where user is sender or receiver
    const pings = await Ping.find({
      $or: [
        { sender: req.user?._id },
        { receiver: req.user?._id }
      ]
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: pings.length,
      data: pings
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
 * Delete a ping (cancel a sent ping)
 * @route DELETE /api/pings/:id
 * @access Private
 */
export const deletePing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ping = await Ping.findById(req.params.id);
    
    if (!ping) {
      res.status(404).json({
        success: false,
        error: 'Ping not found'
      });
      return;
    }
    
    // Ensure ping was sent by current user
    if (ping.sender.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this ping'
      });
      return;
    }
    
    await ping.deleteOne();
    
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