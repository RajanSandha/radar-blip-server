import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Maximum radius to search for nearby users (in meters)
 */
const MAX_RADIUS = 1000;

/**
 * Get nearby users within specified radius
 * @route GET /api/radar/nearby
 * @access Private
 */
export const getNearbyUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get maximum distance from query or use default
    const maxDistance = Math.min(
      parseInt(req.query.radius as string) || MAX_RADIUS, 
      MAX_RADIUS
    );
    
    // Ensure we have user location
    const currentUser = await User.findById(req.user?._id);
    
    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    
    const [longitude, latitude] = currentUser.location.coordinates;
    
    // Use MongoDB's geospatial queries to find nearby users
    const nearbyUsers = await User.find({
      _id: { $ne: req.user?._id }, // Exclude current user
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    }).select('name avatar gender bio interests location.coordinates isOnline lastActive');
    
    // Calculate distance for each user
    const usersWithDistance = nearbyUsers.map(user => {
      // Calculate distance in meters using Haversine formula
      const [userLong, userLat] = user.location.coordinates;
      const distance = calculateDistance(
        latitude, longitude, 
        userLat, userLong
      );
      
      // Calculate angle (bearing) between users
      const angle = calculateAngle(
        latitude, longitude,
        userLat, userLong
      );
      
      return {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        gender: user.gender,
        bio: user.bio,
        interests: user.interests,
        distance: Math.round(distance),
        angle: Math.round(angle),
        isOnline: user.isOnline,
        lastActive: user.lastActive
      };
    });
    
    res.json({
      success: true,
      count: usersWithDistance.length,
      data: usersWithDistance
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
  
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  
  // Normalize to 0-360
  brng = (brng + 360) % 360;
  
  return brng;
}; 