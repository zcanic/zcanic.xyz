const winston = require('winston');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Ensure .env is loaded relative to project root

// Ensure logs directory exists
const fs = require('fs');
const logDir = path.resolve(__dirname, '../logs'); // Define log directory relative to project root
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info' if not set in .env
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Log the full stack trace for errors
    winston.format.splat(),
    winston.format.json() // Log in JSON format
  ),
  defaultMeta: { service: 'zcanic-backend' }, // Add service name to all logs
  transports: [
    // Write all logs with level `error` and below to `logs/error.log`
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    // Write all logs with level `info` and below to `logs/combined.log`
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(), // Add colors
      winston.format.printf(({ level, message, timestamp, stack }) => {
        // Simple format for console output
        if (stack) {
          // Log error stack separately for better readability
          return `${timestamp} ${level}: ${message}\n${stack}`;
        }
        return `${timestamp} ${level}: ${message}`;
      })
    ),
  }));
}

module.exports = logger; 