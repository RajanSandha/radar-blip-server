import mongoose from 'mongoose';

/**
 * Message sub-document interface
 */
interface IMessage {
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  read: boolean;
}

/**
 * Chat document interface
 */
export interface IChat extends mongoose.Document {
  participants: mongoose.Types.ObjectId[];
  messages: IMessage[];
  lastMessage: IMessage;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message schema definition
 */
const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

/**
 * Chat schema definition
 */
const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [MessageSchema],
  lastMessage: {
    type: MessageSchema,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster querying of chats by participants
ChatSchema.index({ participants: 1 });

export default mongoose.model<IChat>('Chat', ChatSchema); 