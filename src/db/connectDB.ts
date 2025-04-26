import mongoose from 'mongoose';
import config from '../config/config';

/**
 * Connect to MongoDB database
 * Implements singleton pattern to prevent multiple connections
 */
const connectDB = async (): Promise<void> => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const conn = await mongoose.connect(config.mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      message = error.message;
    }
    console.error(`Error connecting to MongoDB: ${message}`);
    process.exit(1);
  }
};

export default connectDB; 