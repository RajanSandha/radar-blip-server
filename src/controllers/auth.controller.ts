import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      location: {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates
      }
    });

    // Create token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
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
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
      return;
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Update online status
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    // Create token
    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
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
 * Get current logged in user profile
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);

    res.json({
      success: true,
      data: user
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
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const updateData = {
      name: req.body.name,
      bio: req.body.bio,
      gender: req.body.gender,
      interests: req.body.interests,
      avatar: req.body.avatar
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      key => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
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
 * Logout user (update online status)
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user?._id, {
      isOnline: false,
      lastActive: new Date()
    });

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