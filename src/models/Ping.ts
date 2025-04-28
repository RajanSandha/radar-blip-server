import mongoose from 'mongoose';

/**
 * Ping status types
 */
export type PingStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/**
 * Ping document interface
 */
export interface IPing extends mongoose.Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: PingStatus;
  createdAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
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
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Create indexes for faster querying
PingSchema.index({ sender: 1, recipient: 1 });
PingSchema.index({ status: 1 });
PingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

export default mongoose.model<IPing>('Ping', PingSchema); 