import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config/config';
import Chat from '../models/Chat';

/**
 * Interface for authenticated socket
 */
interface AuthSocket extends Socket {
  userId?: string;
}

/**
 * Map of connected users to their socket ids
 */
const connectedUsers = new Map<string, string>();

/**
 * Initialize socket.io server
 */
const initSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket middleware for authentication
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
      socket.userId = decoded.id;

      // Update user online status
      await User.findByIdAndUpdate(decoded.id, {
        isOnline: true,
        lastActive: new Date()
      });

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.userId}`);

    if (socket.userId) {
      // Store user connection
      connectedUsers.set(socket.userId, socket.id);

      // Join personal room for direct messages
      socket.join(`user:${socket.userId}`);
    }

    // Handle chat messages
    socket.on('send_message', async (data: { chatId: string, message: any }) => {
      const { chatId, message } = data;

      // Broadcast message to chat room
      socket.to(`chat:${chatId}`).emit('new_message', {
        chatId,
        message
      });

      // Find other participants in chat to notify
      try {
        const chat = await Chat.findById(chatId);

        if (chat && socket.userId) {
          // Notify other participants
          chat.participants.forEach((participantId) => {
            const participantIdStr = participantId.toString();
            if (participantIdStr !== socket.userId && connectedUsers.has(participantIdStr)) {
              io.to(`user:${participantIdStr}`).emit('message_notification', {
                chatId,
                message
              });
            }
          });
        }
      } catch (error) {
        console.error('Error sending message notification:', error);
      }
    });

    // Join a chat room
    socket.on('join_chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Leave a chat room
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle incoming ping
    socket.on('send_ping', async (data: { receiverId: string, pingData: any }) => {
      const { receiverId, pingData } = data;

      // Check if receiver is connected
      if (connectedUsers.has(receiverId)) {
        // Send ping to receiver
        io.to(`user:${receiverId}`).emit('incoming_ping', {
          ...pingData,
          senderId: socket.userId
        });
      }
    });

    // Handle ping response
    socket.on('ping_response', (data: { senderId: string, response: 'accepted' | 'declined', pingId: string }) => {
      const { senderId, response, pingId } = data;

      // Check if sender is connected
      if (connectedUsers.has(senderId)) {
        // Send response to sender
        io.to(`user:${senderId}`).emit('ping_response', {
          pingId,
          receiverId: socket.userId,
          response
        });
      }
    });

    // Handle location updates
    socket.on('update_location', async (coordinates: { longitude: number, latitude: number }) => {
      if (!socket.userId) return;

      try {
        await User.findByIdAndUpdate(socket.userId, {
          'location.coordinates': [coordinates.longitude, coordinates.latitude],
          'location.lastUpdated': new Date(),
          lastActive: new Date()
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      if (socket.userId) {
        // Remove from connected users
        connectedUsers.delete(socket.userId);

        // Update user status after a brief delay
        // This prevents status flapping for quick reconnects
        setTimeout(async () => {
          try {
            // Only update if still disconnected
            if (!connectedUsers.has(socket.userId!)) {
              await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastActive: new Date()
              });
            }
          } catch (error) {
            console.error('Error updating offline status:', error);
          }
        }, 10000); // 10 seconds delay
      }
    });
  });

  return io;
};

export default initSocketServer; 