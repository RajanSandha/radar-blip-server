import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config/config';

/**
 * Extended Request interface to include user
 */
export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token and attaches user to request
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };

    // Get user from token id
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
}; 