import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Send connection request to another user
 * @route POST /api/users/connections/request/:userId
 * @access Private
 */
export const sendConnectionRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const targetUserId = req.params.userId;
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    // Prevent sending request to self
    if (targetUserId === req.user?._id.toString()) {
      res.status(400).json({
        success: false,
        error: 'Cannot send connection request to yourself'
      });
      return;
    }
    
    // Update current user's outgoing connection requests
    const currentUser = await User.findById(req.user?._id);
    
    // Check if connection request already sent
    if (currentUser?.outgoingConnectionRequests?.includes(targetUserId)) {
      res.status(400).json({
        success: false,
        error: 'Connection request already sent'
      });
      return;
    }
    
    // Check if users are already connected
    if (currentUser?.connections?.includes(targetUserId)) {
      res.status(400).json({
        success: false,
        error: 'Users are already connected'
      });
      return;
    }
    
    // Add to outgoing requests for current user
    if (!currentUser?.outgoingConnectionRequests) {
      currentUser.outgoingConnectionRequests = [];
    }
    currentUser.outgoingConnectionRequests.push(targetUserId);
    await currentUser.save();
    
    // Add to incoming requests for target user
    if (!targetUser.incomingConnectionRequests) {
      targetUser.incomingConnectionRequests = [];
    }
    targetUser.incomingConnectionRequests.push(req.user?._id);
    await targetUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Connection request sent successfully'
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
 * Block a user
 * @route POST /api/users/block/:userId
 * @access Private
 */
export const blockUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const targetUserId = req.params.userId;
    const { reportReason } = req.body; // Optional report reason
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    // Prevent blocking self
    if (targetUserId === req.user?._id.toString()) {
      res.status(400).json({
        success: false,
        error: 'Cannot block yourself'
      });
      return;
    }
    
    // Update blocked users list
    const currentUser = await User.findById(req.user?._id);
    
    // Check if already blocked
    if (currentUser?.blockedUsers?.includes(targetUserId)) {
      res.status(400).json({
        success: false,
        error: 'User is already blocked'
      });
      return;
    }
    
    // Add to blocked users
    if (!currentUser?.blockedUsers) {
      currentUser.blockedUsers = [];
    }
    currentUser.blockedUsers.push(targetUserId);
    
    // Remove from connections if connected
    if (currentUser?.connections?.includes(targetUserId)) {
      currentUser.connections = currentUser.connections.filter(
        id => id.toString() !== targetUserId
      );
    }
    
    // Remove from incoming/outgoing requests if any
    if (currentUser?.incomingConnectionRequests?.includes(targetUserId)) {
      currentUser.incomingConnectionRequests = currentUser.incomingConnectionRequests.filter(
        id => id.toString() !== targetUserId
      );
    }
    
    if (currentUser?.outgoingConnectionRequests?.includes(targetUserId)) {
      currentUser.outgoingConnectionRequests = currentUser.outgoingConnectionRequests.filter(
        id => id.toString() !== targetUserId
      );
    }
    
    await currentUser.save();
    
    // If report reason provided, log the report
    if (reportReason) {
      // In a real app, store report in database
      console.log(`User ${req.user?._id} reported user ${targetUserId}: ${reportReason}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
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
 * Report a user
 * @route POST /api/users/report/:userId
 * @access Private
 */
export const reportUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const targetUserId = req.params.userId;
    const { reason } = req.body;
    
    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Report reason is required'
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
    
    // In a real app, store report in database
    console.log(`User ${req.user?._id} reported user ${targetUserId}: ${reason}`);
    
    res.status(200).json({
      success: true,
      message: 'User reported successfully'
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