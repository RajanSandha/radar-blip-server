import { Response } from 'express';
import mongoose from 'mongoose';
import Ping from '../models/Ping';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Send a ping to another user
 * @route POST /api/ping/:userId
 * @access Private
 */
export const sendPing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const targetUserId = req.params.userId;
    
    // Validate targetUserId
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
      return;
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    // Prevent sending ping to self
    if (targetUserId === req.user?._id.toString()) {
      res.status(400).json({
        success: false,
        error: 'Cannot send ping to yourself'
      });
      return;
    }
    
    // Check if user is blocked
    const currentUser = await User.findById(req.user?._id);
    
    if (currentUser?.blockedUsers?.includes(targetUserId)) {
      res.status(400).json({
        success: false,
        error: 'Cannot ping a blocked user'
      });
      return;
    }
    
    if (targetUser.blockedUsers?.includes(req.user?._id)) {
      res.status(400).json({
        success: false,
        error: 'Unable to ping this user'
      });
      return;
    }
    
    // Check for existing active ping
    const existingPing = await Ping.findOne({
      $or: [
        { sender: req.user?._id, recipient: targetUserId, status: 'pending' },
        { sender: targetUserId, recipient: req.user?._id, status: 'pending' }
      ]
    });
    
    if (existingPing) {
      res.status(400).json({
        success: false,
        error: 'A ping request is already active between these users'
      });
      return;
    }
    
    // Create new ping
    const ping = await Ping.create({
      sender: req.user?._id,
      recipient: targetUserId,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
    });
    
    // In a real app, this would trigger a notification to the recipient
    // (e.g., through WebSockets or push notifications)
    
    res.status(201).json({
      success: true,
      data: {
        id: ping._id,
        recipient: targetUserId,
        status: ping.status,
        expiresAt: ping.expiresAt
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
 * Respond to a ping
 * @route POST /api/ping/:pingId/respond
 * @access Private
 */
export const respondToPing = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const pingId = req.params.pingId;
    const { accept } = req.body;
    
    if (typeof accept !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'Accept parameter must be a boolean'
      });
      return;
    }
    
    // Find the ping
    const ping = await Ping.findById(pingId);
    
    if (!ping) {
      res.status(404).json({
        success: false,
        error: 'Ping not found'
      });
      return;
    }
    
    // Verify the ping is for the current user
    if (ping.recipient.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to respond to this ping'
      });
      return;
    }
    
    // Check if ping is still pending
    if (ping.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Ping already ${ping.status}`
      });
      return;
    }
    
    // Check if ping has expired
    if (ping.expiresAt < new Date()) {
      ping.status = 'expired';
      await ping.save();
      
      res.status(400).json({
        success: false,
        error: 'Ping has expired'
      });
      return;
    }
    
    // Update ping status based on response
    ping.status = accept ? 'accepted' : 'declined';
    ping.respondedAt = new Date();
    await ping.save();
    
    // In a real app, this would trigger a notification to the sender
    // (e.g., through WebSockets or push notifications)
    
    res.status(200).json({
      success: true,
      data: {
        id: ping._id,
        sender: ping.sender,
        status: ping.status,
        respondedAt: ping.respondedAt
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