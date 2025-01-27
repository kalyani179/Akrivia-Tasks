// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); // captures the stack trace of the error and stores it in the error object
  }
}

// Not Found Error Handler
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

// Global Error Handler
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  console.error('Error:', {
    statusCode: err.statusCode,
    status: err.status,
    message: err.message,
    stack: err.stack  //gives detailed report of the sequence of function calls that led to the error being thrown
  });

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Async Handler to catch async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Socket Error Handler
const socketErrorHandler = (socket, error) => {
  console.error('Socket Error:', error);
  
  const errorResponse = {
    status: 'error',
    message: error.message 
  };

  socket.emit('error', errorResponse);
};

// Common error types
const commonErrors = {
  BadRequestError: (message) => new ApiError(400, message || 'Bad Request'),
  UnauthorizedError: (message) => new ApiError(401, message || 'Unauthorized'),
  ForbiddenError: (message) => new ApiError(403, message || 'Forbidden'),
  NotFoundError: (message) => new ApiError(404, message || 'Not Found'),
  ConflictError: (message) => new ApiError(409, message || 'Conflict'),
  ValidationError: (message) => new ApiError(422, message || 'Validation Error'),
  InternalError: (message) => new ApiError(500, message || 'Internal Server Error')
};

module.exports = {
  ApiError,
  notFoundHandler,
  globalErrorHandler,
  asyncHandler,
  socketErrorHandler,
  commonErrors
};
