const morgan = require('morgan');
const logger = require('./logger'); // Assuming logger.js is in the same directory

const morganFormat = ":method :url :status :response-time ms";

// Middleware for morgan logging
const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => {
      const logObject = {
        method: message.split(" ")[0],
        url: message.split(" ")[1],
        status: message.split(" ")[2],
        responseTime: message.split(" ")[3],
      };
      logger.info(JSON.stringify(logObject));  // Log the message with your custom logger
    },
  },
});

module.exports = morganMiddleware;
