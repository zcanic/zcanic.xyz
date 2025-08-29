const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log the first error for brevity in logs, but return it
    const firstError = errors.array()[0];
    logger.warn('[Validation Error] Request validation failed', {
      path: req.path,
      method: req.method,
      error: firstError,
      // allErrors: errors.array() // Optionally log all errors
    });
    // Return the message of the first error found
    return res.status(400).json({ message: firstError.msg });
  }
  next();
};

module.exports = { handleValidationErrors }; 