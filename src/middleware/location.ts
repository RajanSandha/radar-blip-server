import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from './auth';

/**
 * Middleware to update user location
 * Extracts coordinates from request body and updates user's location in database
 */
export const updateLocation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract coordinates from request
    const { longitude, latitude } = req.body;
    
    if (!longitude || !latitude) {
      next();
      return;
    }
    
    // Validate coordinates
    const isValidLong = typeof longitude === 'number' && longitude >= -180 && longitude <= 180;
    const isValidLat = typeof latitude === 'number' && latitude >= -90 && latitude <= 90;
    
    if (!isValidLong || !isValidLat) {
      next();
      return;
    }
    
    // Update user location
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, {
        'location.coordinates': [longitude, latitude],
        'location.lastUpdated': new Date(),
        'lastActive': new Date(),
        'isOnline': true
      }, { new: true });
    }
    
    next();
  } catch (error) {
    // Just log error but don't interrupt request flow
    console.error('Error updating location:', error);
    next();
  }
}; 