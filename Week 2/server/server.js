const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv'); // To manage the env variables locally

// middlewares
const morganMiddleware = require('./middlewares/morgan');
const limiter = require('./middlewares/rateLimiter');
// routes
const authRouter = require('./routers/userAuthRouter');
const profileRouter = require('./routers/userProfileRouter');
const fileRouter = require('./routers/fileRouter');

dotenv.config(); // To Load environment variables from .env to process.env

const server = express();
const PORT = process.env.PORT || 3000; //  object in Node.js that provides access to environment variables

// Middlewares
server.use(cors()); // allows the server to handle requests from different origins (domains).
// Increase payload size limit
server.use(bodyParser.json({ limit: '10mb' }));
server.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); 
server.use(morganMiddleware);

// Routes
server.use('/auth', limiter, authRouter); 
server.use('/profile', limiter, profileRouter);
server.use('/file',fileRouter);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); // listen for incoming requests on a specified port or host.