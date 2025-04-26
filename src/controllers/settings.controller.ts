import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Get user settings
 * @route GET /api/users/settings
 * @access Private
 */
export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Return user settings
    res.json({
      success: true,
      settings: user.settings || {
        theme: 'light',
        showNearbyUsersList: true,
        showUserBlips: true,
        radarRange: 5
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
 * Update user settings
 * @route PUT /api/users/settings
 * @access Private
 */
export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get settings from request body
    const { settings } = req.body;
    
    if (!settings) {
      res.status(400).json({
        success: false,
        error: 'Settings data is required'
      });
      return;
    }
    
    // Update user settings
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { settings },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Return updated settings
    res.json({
      success: true,
      settings: user.settings
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