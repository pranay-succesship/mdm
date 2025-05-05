const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
require('winston-daily-rotate-file');
require('dotenv').config();

// Define log directory
const logDir = path.join(__dirname, '../logs');

// Get log configuration from environment variables
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '20m';
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '14d';

// Define colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

// Add colors to Winston
winston.addColors(colors);

// Define custom format for console output
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, service, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length) {
      if (metadata.error && metadata.error.stack) {
        metaStr = `\n${metadata.error.stack}`;
      } else {
        metaStr = `\n${JSON.stringify(metadata, null, 2)}`;
      }
    }
    return `[${timestamp}] ${level} ${service ? `[${service}]` : ''}: ${message}${metaStr}`;
  })
);

// Define custom format for file output (without colors)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, service, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length) {
      if (metadata.error && metadata.error.stack) {
        metaStr = `\n${metadata.error.stack}`;
      } else {
        metaStr = `\n${JSON.stringify(metadata, null, 2)}`;
      }
    }
    return `[${timestamp}] ${level} ${service ? `[${service}]` : ''}: ${message}${metaStr}`;
  })
);

// Create file transport with daily rotation
const fileRotateTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, '%DATE%-combined.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: fileFormat,
});

// Create error file transport with daily rotation
const errorFileRotateTransport = new transports.DailyRotateFile({
  filename: path.join(logDir, '%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  level: 'error',
  format: fileFormat,
});

// Create a custom logger instance
const logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'mdm-backend' },
  transports: [
    // Console transport
    new transports.Console({
      format: consoleFormat,
    }),
    // File transports
    fileRotateTransport,
    errorFileRotateTransport,
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Create a stream object to be used by Morgan for HTTP logging
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Wrap the logger with convenience methods for different components
const getComponentLogger = (component) => {
  return {
    error: (message, meta = {}) => logger.error(message, { ...meta, component }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, component }),
    info: (message, meta = {}) => logger.info(message, { ...meta, component }),
    http: (message, meta = {}) => logger.http(message, { ...meta, component }),
    debug: (message, meta = {}) => logger.debug(message, { ...meta, component }),
  };
};

module.exports = {
  logger,
  getComponentLogger,
};