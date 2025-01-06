const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// middlewares
const morganMiddleware = require('./middlewares/morgan');
const limiter = require('./middlewares/rateLimiter');

// routes
const authRouter = require('./routers/userAuthRouter');
const profileRouter = require('./routers/userProfileRouter');

// To Load environment variables
dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

// Middlewares
server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(morganMiddleware);

// Routes
server.use('/auth', limiter, authRouter); 
server.use('/profile', limiter, profileRouter);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});