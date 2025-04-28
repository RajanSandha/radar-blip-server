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

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/localping
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```

3. Start the development server:
```bash
npm run dev
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

## Available Scripts

- `npm run dev`: Start the development server with hot reload
- `npm run build`: Build the project for production
- `npm start`: Start the production server
- `npm test`: Run tests

## Troubleshooting

### MongoDB Geo Index Error

If you encounter the following error:
```
error processing query: ns=radar-blip.usersTree: $and $not _id $eq ObjectId(...) $not blockedUsers $eq ObjectId(...) GEONEAR field=location maxdist=2000 isNearSphere=0 Sort: {} Proj: { _id: 1, gender: 1, isOnline: 1, lastActive: 1, location: 1 } planner returned error :: caused by :: unable to find index for $geoNear query
```

This indicates that the required 2dsphere index is missing or incorrectly configured. To fix it:

1. Run the rebuild indexes script:
```bash
npm run rebuild-indexes
```

2. Or manually create the index in MongoDB shell:
```javascript
db.users.createIndex({ "location.coordinates": "2dsphere" })
```

The application requires a 2dsphere index on the User collection's location.coordinates field for geo-location queries to work properly. 