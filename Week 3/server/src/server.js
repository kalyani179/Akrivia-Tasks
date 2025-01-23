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

io.on("connection", (socket) => {
   socket.emit("message", "Welcome to the chat");
    console.log("a user connected");
    socket.on("message", (message) => {
      console.log(message);
      io.emit("message", message);
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

// Use routes
server.use('/api',limiter, routes);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});