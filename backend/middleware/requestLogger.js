const { getComponentLogger } = require('../utils/logger');

// Initialize component logger
const httpLogger = getComponentLogger('http');

/**
 * Custom HTTP request logging middleware that provides detailed information
 * about incoming requests and their responses
 */
const requestLogger = (req, res, next) => {
  const startTime = new Date();
  
  // Log request details when it begins
  httpLogger.info(`${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id || 'unauthenticated',
    query: req.query,
    contentType: req.get('content-type')
  });

  // Store the original end function
  const originalEnd = res.end;
  
  // Override the end function to add response logging
  res.end = function (chunk, encoding) {
    // Calculate request duration
    const responseTime = new Date() - startTime;
    
    // Restore the original end function
    res.end = originalEnd;
    
    // Call the original end function
    res.end(chunk, encoding);
    
    // Log response details
    const logMethod = res.statusCode >= 400 ? 'warn' : 'debug';
    
    httpLogger[logMethod](`${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime,
      userId: req.user?._id || 'unauthenticated',
      contentLength: res.get('content-length'),
      // Don't log response body for security and size reasons
    });
  };
  
  next();
};

module.exports = requestLogger;