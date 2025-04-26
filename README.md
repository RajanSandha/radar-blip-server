# RadarBlip Backend API

Backend server for the RadarBlip proximity app. Built with Node.js, Express, MongoDB, and Socket.io.

## Features

- Authentication with JWT
- Real-time location sharing
- Geospatial user discovery
- Ping/connection requests
- Real-time messaging
- User profiles

## Tech Stack

- **Node.js & TypeScript**: Modern JavaScript runtime with type safety
- **Express**: Web framework for handling HTTP requests
- **MongoDB & Mongoose**: NoSQL database with ODM
- **Socket.io**: Real-time bidirectional event-based communication
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the server directory (use `.env.example` as a template)
5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Radar

- `GET /api/radar/nearby` - Get nearby users

### Pings

- `GET /api/pings` - Get all pings
- `POST /api/pings/send` - Send a ping
- `PUT /api/pings/:id/respond` - Respond to a ping
- `DELETE /api/pings/:id` - Delete a ping

### Chats

- `GET /api/chats` - Get all chats
- `GET /api/chats/:userId` - Get or create chat with user
- `POST /api/chats/:chatId/messages` - Send a message
- `PUT /api/chats/:chatId/read` - Mark messages as read

## Socket.io Events

### Client to Server

- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `send_message` - Send a message
- `send_ping` - Send a ping
- `ping_response` - Respond to a ping
- `update_location` - Update user location

### Server to Client

- `new_message` - New message notification
- `message_notification` - Message notification for users not in chat
- `incoming_ping` - Incoming ping notification
- `ping_response` - Ping response notification

## License

This project is licensed under the MIT License. 