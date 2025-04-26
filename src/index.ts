import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/config';
import connectDB from './db/connectDB';
import initSocketServer from './socket/socketService';

// Route imports
import authRoutes from './routes/auth.routes';
import radarRoutes from './routes/radar.routes';
import pingRoutes from './routes/ping.routes';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes';

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocketServer(server);

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed origins
    if (config.corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/radar', radarRoutes);
app.use('/api/pings', pingRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is up and running',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 