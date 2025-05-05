const { getComponentLogger } = require('./logger');

// Initialize logger for this utility
const utilLogger = getComponentLogger('logUtils');

/**
 * Collection of utility functions for standardized logging across the application
 */
const logUtils = {
  /**
   * Logs a database operation for auditing purposes
   * 
   * @param {string} operation - Type of operation (create, update, delete, etc.)
   * @param {string} model - Name of the model/collection being operated on
   * @param {object} user - User performing the operation
   * @param {string|object} documentId - ID or info of the document being affected
   * @param {object} details - Additional details about the operation
   */
  logDbOperation: (operation, model, user, documentId, details = {}) => {
    const dbLogger = getComponentLogger('database');
    
    dbLogger.info(`${operation} operation on ${model}`, {
      operation,
      model,
      userId: user?._id || 'system',
      username: user?.username || 'system',
      documentId,
      ...details
    });
  },
  
  /**
   * Logs a security event such as login attempts, permission changes, etc.
   * 
   * @param {string} event - Type of security event
   * @param {boolean} success - Whether the event was successful
   * @param {object} user - User involved in the event
   * @param {object} details - Additional details about the event
   */
  logSecurityEvent: (event, success, user, details = {}) => {
    const securityLogger = getComponentLogger('security');
    
    const level = success ? 'info' : 'warn';
    
    securityLogger[level](`Security event: ${event}`, {
      event,
      success,
      userId: user?._id || 'unknown',
      username: user?.username || 'unknown',
      ip: details.ip || 'unknown',
      ...details
    });
  },
  
  /**
   * Logs a business event such as entity creation, workflow completion, etc.
   * 
   * @param {string} event - Type of business event
   * @param {object} user - User who triggered the event
   * @param {object} details - Additional details about the event
   */
  logBusinessEvent: (event, user, details = {}) => {
    const businessLogger = getComponentLogger('business');
    
    businessLogger.info(`Business event: ${event}`, {
      event,
      userId: user?._id || 'system',
      username: user?.username || 'system',
      ...details
    });
  },
  
  /**
   * Logs performance metrics for optimization purposes
   * 
   * @param {string} operation - Operation being measured
   * @param {number} durationMs - Duration in milliseconds
   * @param {object} details - Additional details about the operation
   */
  logPerformance: (operation, durationMs, details = {}) => {
    const perfLogger = getComponentLogger('performance');
    
    // Determine log level based on duration thresholds
    let level = 'debug';
    if (durationMs > 1000) level = 'warn'; // Over 1 second
    if (durationMs > 5000) level = 'error'; // Over 5 seconds
    
    perfLogger[level](`Performance: ${operation} - ${durationMs}ms`, {
      operation,
      durationMs,
      ...details
    });
  }
};

module.exports = logUtils;