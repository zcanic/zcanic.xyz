const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  // Log the full error using Winston
  // Use err.stack for the full trace, err.message for the message
  logger.error('Unhandled error caught by global handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    // Add other relevant context if needed, e.g., req.user?.id
    userId: req.user?.id 
  });

  // Determine the status code
  // Use err.statusCode if it's a custom operational error, otherwise default to 500
  const statusCode = err.statusCode || 500;

  // Determine the response message
  // For operational errors (statusCode < 500), send the error message directly
  // For server errors (statusCode >= 500), send a generic message
  const message = statusCode < 500 ? err.message : '服务器内部发生错误喵 T_T，请稍后再试或联系管理员。';

  // Base response object
  const responsePayload = {
    status: 'error',
    message: message,
  };

  // Add stack trace in development environment for 500 errors
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    responsePayload.stack = err.stack;
    logger.debug('[Global Error Handler] Adding stack trace to response in development mode.');
  }

  // Send the JSON response
  res.status(statusCode).json(responsePayload);
};

module.exports = globalErrorHandler; 