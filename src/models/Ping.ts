import mongoose from 'mongoose';

/**
 * Ping document interface
 */
export interface IPing extends mongoose.Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  distance: number; // Distance in meters when ping was sent
  message?: string; // Optional message with ping
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // Pings expire after a certain time if not responded to
}

/**
 * Ping schema definition
 */
const PingSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  distance: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    maxlength: [200, 'Message cannot be more than 200 characters']
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Set default expiration to 24 hours from now
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    }
  }
}, {
  timestamps: true
});

// Create indexes for faster querying
PingSchema.index({ sender: 1, receiver: 1 });
PingSchema.index({ status: 1 });
PingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

export default mongoose.model<IPing>('Ping', PingSchema); 