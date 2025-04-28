import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Server configuration interface
 */
interface ServerConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpire: string;
  mongoUri: string;
  corsOrigins: string[];
}

/**
 * Configuration object with environment variables and defaults
 */
const config: ServerConfig = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'local_development_secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/radar-blip',
  corsOrigins: (process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:5173', 'http://localhost:8080']),
};

export default config; 