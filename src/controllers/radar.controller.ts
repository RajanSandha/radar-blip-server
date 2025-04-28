import { Response } from 'express';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

/**
 * Maximum radius to search for nearby users (in kilometers)
 */
const MAX_RADIUS = 10;

/**
 * Update user location
 * @route POST /api/radar/location
 * @access Private
 */
export const updateLocation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      res.status(400).json({
        success: false,
        error: 'Invalid coordinates format. Expecting [longitude, latitude]'
      });
      return;
    }
    
    // Validate coordinates
    const [longitude, latitude] = coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Coordinates must be numbers'
      });
      return;
    }
    
    // Update user location
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      lastUpdated: new Date()
    };
    
    // Set user as online
    user.isOnline = true;
    user.lastActive = new Date();
    
    await user.save();
    
    console.log(`User ${user._id} location updated to ${longitude}, ${latitude}`);
    
    res.status(200).json({
      success: true,
      data: {
        coordinates: user.location.coordinates,
        lastUpdated: user.location.lastUpdated
      }
    });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      message = error.message;
    }
    
    console.error('Error updating location:', message);
    
    res.status(500).json({
      success: false,
      error: message
    });
  }
};

/**
 * Get nearby users
 * @route GET /api/radar/nearby
 * @access Private
 */
export const getNearbyUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get the current user with proper typing
    const currentUser = await User.findById(req.user._id) as IUser;
    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    // Get radar range from query parameter (default to user settings)
    const range = req.query.range ? 
      parseInt(req.query.range as string) : 
      currentUser.settings.radarRange;
    
    // Validate range
    if (isNaN(range) || range <= 0 || range > MAX_RADIUS) {
      res.status(400).json({
        success: false,
        error: `Invalid range parameter. Must be between 1 and ${MAX_RADIUS}`
      });
      return;
    }
    
    // Get current location
    const { coordinates } = currentUser.location;
    
    if (!coordinates || coordinates.length !== 2) {
      res.status(400).json({
        success: false,
        error: 'Current user location not available'
      });
      return;
    }
    
    const userId = currentUser._id.toString();
    console.log(`Finding users near [${coordinates}] within ${range}km radius for user ${userId}`);
    
    // Convert range from km to meters for query
    const rangeInMeters = range * 1000;
    
    // Find nearby users using MongoDB geospatial query
    // Use $geoWithin with $centerSphere which doesn't require special index
    const nearbyUsers = await User.find({
      _id: { $ne: userId },
      blockedUsers: { $nin: [userId] },
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [coordinates, rangeInMeters / 6371000] // radius in radians
        }
      }
    }).select('_id gender isOnline lastActive location blockedUsers');
    
    // Filter out users that have blocked the current user
    const filteredUsers = nearbyUsers.filter(user => 
      !user.blockedUsers || !user.blockedUsers.some(id => id.toString() === userId)
    );
    
    console.log(`Found ${filteredUsers.length} nearby users`);
    
    // Calculate distance and angle for each user
    const processedUsers = filteredUsers.map(user => {
      // Calculate distance in meters
      const [lon1, lat1] = coordinates;
      const [lon2, lat2] = user.location.coordinates;
      
      // Calculate distance using the helper function
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      
      // Calculate angle using the helper function
      const angle = calculateAngle(lat1, lon1, lat2, lon2);
      
      return {
        _id: user._id,
        gender: user.gender || 'other',
        isOnline: user.isOnline,
        lastActive: user.lastActive,
        distance: Math.round(distance),
        angle: Math.round(angle)
      };
    });
    
    res.status(200).json({
      success: true,
      count: processedUsers.length,
      data: processedUsers
    });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      message = error.message;
    }
    
    console.error('Error finding nearby users:', message);
    
    res.status(500).json({
      success: false,
      error: message
    });
  }
};

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = 
    Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

/**
 * Calculate angle (bearing) between two coordinates in degrees
 * Returns degrees from north (0-360)
 */
const calculateAngle = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  const θ = Math.atan2(y, x);
  const bearing = (θ * 180 / Math.PI + 360) % 360; // In degrees
  
  return bearing;
}; 