# Logging System Documentation

This document provides information on the logging system implemented in the Master Data Management (MDM) backend application.

## Overview

The MDM application uses Winston for structured logging with different severity levels, component tagging, and automatic log rotation. The logging system has been designed to provide:

- Readable, structured logs for development and debugging
- Separate error logs for easier troubleshooting
- Daily log rotation with retention policies
- Component-specific logging for better organization
- Utility functions for common logging patterns

## Log Levels

From highest to lowest severity:

1. **ERROR**: Critical failures requiring immediate attention
2. **WARN**: Unexpected situations that don't cause system failure
3. **INFO**: Important system events and state changes
4. **HTTP**: API request/response information
5. **DEBUG**: Detailed information for developers (development only)

The active log level is controlled by the `LOG_LEVEL` environment variable (default: 'info' in production, 'debug' in development).

## Log Files

Logs are stored in the `/logs` directory with the following format:

- `YYYY-MM-DD-combined.log`: All logs of all levels
- `YYYY-MM-DD-error.log`: Error-level logs only

Log files are automatically rotated daily and retained according to the `LOG_MAX_FILES` environment variable (default: 14 days).

## How to Use the Logging System

### Basic Component Logging

For controllers, models, and services, create a component-specific logger:

```javascript
const { getComponentLogger } = require('../utils/logger');

// Initialize component-specific logger
const authLogger = getComponentLogger('authentication');

// Use logging methods with meaningful messages and structured data
authLogger.info('User authenticated successfully', { 
  userId: '12345',
  method: 'JWT',
  ipAddress: '192.168.1.1'
});

// For errors, include the error object for stack traces
authLogger.error('Authentication failed', { 
  error: err, 
  userId: '12345' 
});
```

### Using Logging Utilities

For common logging patterns, use the utility functions in `utils/logUtils.js`:

```javascript
const logUtils = require('../utils/logUtils');

// Log database operations
logUtils.logDbOperation(
  'create',           // operation type
  'User',             // model name
  req.user,           // user performing the operation
  newUser._id,        // document ID
  { role: 'admin' }   // additional details
);

// Log security events
logUtils.logSecurityEvent(
  'login_attempt',    // event type
  false,              // success status
  { email: req.body.email }, // user info
  { ip: req.ip }      // additional details
);

// Log business events
logUtils.logBusinessEvent(
  'entity_published',  // event type
  req.user,            // user info
  { entityId: '12345', entityType: 'Product' } // details
);

// Log performance metrics
logUtils.logPerformance(
  'database_query',    // operation name
  236,                 // duration in milliseconds
  { query: 'findAllProducts', filters: { isActive: true } }  // details
);
```

### HTTP Request Logging

HTTP requests are automatically logged by the custom middleware in `middleware/requestLogger.js`. Each request logs:

1. When the request starts (with request details)
2. When the request completes (with response status and duration)

## Best Practices

1. **Use structured data**: Always include relevant context as structured data, not in the message string
   ```javascript
   // Good
   logger.info('User registered', { userId, email });
   
   // Not ideal
   logger.info(`User ${email} registered with ID ${userId}`);
   ```

2. **Log level guidance**:
   - **ERROR**: Use for unhandled exceptions, system failures, or critical business rule violations
   - **WARN**: Use for handled exceptions, invalid user operations, or security concerns
   - **INFO**: Use for state changes, key business events, and system lifecycle events
   - **DEBUG**: Use for detailed execution flow, variable values, or other developer information

3. **Sensitive data**: Never log passwords, tokens, or personal identifiable information

4. **Error objects**: When logging errors, include the full error object to capture stack traces:
   ```javascript
   try {
     // code that might throw
   } catch (error) {
     logger.error('Operation failed', { error });
   }
   ```

## Configuration

Logging behavior can be customized via environment variables:

- `LOG_LEVEL`: Minimum log level to capture (default: 'info')
- `LOG_MAX_SIZE`: Maximum size per log file (default: '20m')
- `LOG_MAX_FILES`: Log retention policy (default: '14d')

## Viewing Logs

During development, logs will appear in the console with colors for readability. In production, you should use tools like `tail`, `less`, or log aggregation systems to view and analyze logs.

For example:
```bash
# View the latest combined logs
tail -f logs/$(date +%Y-%m-%d)-combined.log

# View only error logs
tail -f logs/$(date +%Y-%m-%d)-error.log
```