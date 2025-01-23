const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { swaggerUi, specs } = require('./swagger'); // Import Swagger configuration
const routes = require('./v1/routes');
const morganMiddleware = require('./middleware/loggers/morgan');
const limiter = require('./middleware/rateLimiter/rateLimit');
const helmet = require('helmet');

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

  // Handle user joining
  socket.on('join', (userData) => {
    console.log('User joined:', userData);
    activeUsers.set(socket.id, userData);
    
    // Broadcast updated user list to all clients
    io.emit('users', Array.from(activeUsers.values()));
  });

  // Handle private messages
  socket.on('private-message', ({ to, message }) => {
    const sender = activeUsers.get(socket.id);
    if (sender && to) {
      const messageData = {
        text: message,
        sender: sender,
        timestamp: new Date(),
        type: 'private'
      };
      
      // Send to recipient and sender
      io.to(to).emit('private-message', messageData);
      socket.emit('private-message', messageData);
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
        rooms.get(roomName).push(user);
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
      rooms.get(roomName).push(user);
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
      rooms.set(roomName, rooms.get(roomName).filter(u => u.id !== user.id));
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
        sender: sender,
        timestamp: new Date(),
        type: 'group',
        room: room
      };
      io.to(room).emit('group-message', messageData);
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

// Use routes
server.use('/api',limiter, routes);

server.use(encryptMiddleware);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});