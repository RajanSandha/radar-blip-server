import mongoose from 'mongoose';
import config from '../config/config';
import User from '../models/User';

/**
 * Utility script to rebuild indexes in MongoDB
 * This will solve issues with missing or incorrectly defined indexes
 */
const rebuildIndexes = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri as string);
    console.log('Connected to MongoDB');

    // Drop existing indexes on User collection
    console.log('Dropping existing indexes on User collection...');
    await User.collection.dropIndexes();
    console.log('Dropped existing indexes');

    // Recreate the indexes
    console.log('Creating 2dsphere index on location.coordinates...');
    await User.collection.createIndex({ 'location.coordinates': '2dsphere' });
    console.log('Created 2dsphere index');

    // Create other useful indexes
    console.log('Creating additional indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ isOnline: 1 });
    console.log('Created additional indexes');

    console.log('All indexes recreated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error rebuilding indexes:', error);
    process.exit(1);
  }
};

// Run the script if this file is executed directly
if (require.main === module) {
  rebuildIndexes();
}

export default rebuildIndexes; 