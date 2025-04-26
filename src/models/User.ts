import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config';

/**
 * User settings interface
 */
export interface IUserSettings {
  theme: string;
  showNearbyUsersList: boolean;
  showUserBlips: boolean;
  radarRange: number;
}

/**
 * User document interface
 */
export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  interests?: string[];
  location: {
    type: string;
    coordinates: number[];
    lastUpdated: Date;
  };
  settings: IUserSettings;
  isOnline: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

/**
 * User schema definition
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'default-avatar.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  interests: [String],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
      required: true,
      default: [0, 0] // [longitude, latitude]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    showNearbyUsersList: {
      type: Boolean,
      default: true
    },
    showUserBlips: {
      type: Boolean,
      default: true
    },
    radarRange: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Encrypt password using bcrypt
 */
UserSchema.pre('save', async function(this: IUser, next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Match user entered password to hashed password in database
 */
UserSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Sign JWT and return
 */
UserSchema.methods.getSignedJwtToken = function(): string {
  return jwt.sign(
    { id: this._id },
    config.jwtSecret as any,
    { expiresIn: config.jwtExpire } as any
  );
};

export default mongoose.model<IUser>('User', UserSchema); 