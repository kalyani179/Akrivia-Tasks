const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { swaggerUi, specs } = require('./swagger');
const routes = require('./v1/routes');
const morganMiddleware = require('./middleware/loggers/morgan.middleware');
const limiter = require('./middleware/rateLimiter/rateLimiter.middleware');
const helmet = require('helmet');
const { notFoundHandler, globalErrorHandler, socketErrorHandler } = require('./middleware/error_handlers/errorHandler.middleware');

const { createServer } = require("http");
const { Server } = require("socket.io");
const { encryptMiddleware, decryptMiddleware } = require('./middleware/crypto/encrypt.decrypt.middlware');

dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

const httpServer = createServer(server);
const io = new Server(httpServer, { 
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  } 
 });

// Store active users with their socket IDs
const activeUsers = new Map();
const rooms = new Map(); // Store chat rooms and their members

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle socket errors
  socket.on('error', (error) => {
    socketErrorHandler(socket, error);
  });

  // Handle user joining
  socket.on('join', (userData) => {
    console.log('User joined:', userData);
    // Add socket.id to the user data
    const userWithId = { ...userData, id: socket.id };
    activeUsers.set(socket.id, userWithId);
    console.log(activeUsers);
    // Broadcast updated user list to all clients
    io.emit('users', Array.from(activeUsers.values()));
  });

  // Handle private messages
  socket.on('private-message', ({ to, message }) => {
    const sender = activeUsers.get(socket.id);
    if (sender && to) {
      const messageData = {
        text: message,
        sender: { ...sender, id: socket.id },
        timestamp: new Date(),
        type: 'private'
      };
      
      // Send to recipient
      socket.to(to).emit('private-message', messageData);
      // Send back to sender
      socket.emit('private-message', messageData);
      
      console.log('Private message sent:', {
        from: sender.username,
        to: to,
        message: messageData
      });
    }
  });

  // Handle group chat functionality
  socket.on('create-room', (roomName) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.join(roomName);
      if (!rooms.has(roomName)) {
        rooms.set(roomName, [user]);
      } else {
        // Check if user is not already in the room
        const roomUsers = rooms.get(roomName);
        if (!roomUsers.some(u => u.id === user.id)) {
          roomUsers.push(user);
        }
      }
      io.emit('room-list', Array.from(rooms.keys()));
      io.to(roomName).emit('room-users', {
        room: roomName,
        users: rooms.get(roomName)
      });
    }
  });

  socket.on('join-room', (roomName) => {
    const user = activeUsers.get(socket.id);
    if (user && rooms.has(roomName)) {
      socket.join(roomName);
      // Check if user is not already in the room
      const roomUsers = rooms.get(roomName);
      if (!roomUsers.some(u => u.id === user.id)) {
        roomUsers.push(user);
      }
      io.to(roomName).emit('room-users', {
        room: roomName,
        users: rooms.get(roomName)
      });
    }
  });

  socket.on('leave-room', (roomName) => {
    const user = activeUsers.get(socket.id);
    if (user && rooms.has(roomName)) {
      socket.leave(roomName);
      // Remove user from room
      const roomUsers = rooms.get(roomName);
      rooms.set(roomName, roomUsers.filter(u => u.id !== user.id));
      
      // Delete room if empty
      if (rooms.get(roomName).length === 0) {
        rooms.delete(roomName);
        io.emit('room-list', Array.from(rooms.keys()));
      } else {
        io.to(roomName).emit('room-users', {
          room: roomName,
          users: rooms.get(roomName)
        });
      }
    }
  });

  socket.on('group-message', ({ room, message }) => {
    const sender = activeUsers.get(socket.id);
    if (sender && rooms.has(room)) {
      const messageData = {
        text: message,
        sender: {
          id: socket.id,
          username: sender.username
        },
        timestamp: new Date().toISOString(),  // Use ISO string for consistent timestamp
        messageId: `${socket.id}_${Date.now()}`,  // Add unique message ID
        type: 'group',
        room: room
      };
      
      // Send to all users in the room including sender
      io.in(room).emit('group-message', messageData);
      
      console.log('Group message sent:', {
        room: room,
        from: sender.username,
        message: messageData
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const user = activeUsers.get(socket.id);
    
    if (user) {
      // Remove user from all rooms
      rooms.forEach((users, roomName) => {
        rooms.set(roomName, users.filter(u => u.id !== user.id));
        if (rooms.get(roomName).length === 0) {
          rooms.delete(roomName);
        } else {
          io.to(roomName).emit('room-users', {
            room: roomName,
            users: rooms.get(roomName)
          });
        }
      });
      
      // Remove user from active users
      activeUsers.delete(socket.id);
      
      // Broadcast updated lists
      io.emit('users', Array.from(activeUsers.values()));
      io.emit('room-list', Array.from(rooms.keys()));
    }
  });
});

// Middlewares
server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(morganMiddleware);
server.use(helmet());
// Swagger setup
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

server.use(decryptMiddleware);

server.use(limiter);

// Use routes
server.use('/api', routes);

server.use(encryptMiddleware);

// Error Handling Middlewares
server.use(notFoundHandler);  // Handle 404 errors
server.use(globalErrorHandler);  // Global error handler

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});