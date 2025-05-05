const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const { logger, getComponentLogger } = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const connectDB = require('./config/db');
const seedData = require('./config/seedData');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const rolePermissionRoutes = require('./routes/rolePermissionRoutes');
const userRoleRoutes = require('./routes/userRoleRoutes');
const entityRoutes = require('./routes/entityRoutes');
const entityRecordRoutes = require('./routes/entityRecordRoutes');

// Initialize component logger
const appLogger = getComponentLogger('app');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB()
  .then(() => {
    appLogger.info('MongoDB connected successfully');
    // Seed initial data after connection is established
    // seedData();
  })
  .catch(error => {
    appLogger.error('MongoDB connection failed', { error });
  });

// CORS configuration
const corsOptions = {
  origin: '*',  // Allow all origins
  credentials: true,  // This allows cookies to be sent with CORS requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Morgan HTTP request logging - simple console format
app.use(morgan('dev', { stream: logger.stream }));

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply custom request logging middleware for detailed logs
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles/:roleId/permissions', rolePermissionRoutes);
app.use('/api/users/:userId/roles', userRoleRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/entity-records', entityRecordRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Role-based Authentication API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  appLogger.error('Unhandled error', { 
    error: err,
    path: req.path,
    method: req.method,
    userId: req.user?._id,
    ip: req.ip
  });
  
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Handle 404 - Route not found
app.use((req, res) => {
  appLogger.warn('Route not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id
  });
  
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

// Process error handlers
process.on('unhandledRejection', (reason, promise) => {
  appLogger.error('Unhandled Promise Rejection', { reason });
  // Don't exit the process in production, just log the error
  // process.exit(1);
});

process.on('uncaughtException', (error) => {
  appLogger.error('Uncaught Exception', { error });
  // Don't exit the process in production, just log the error
  // process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  appLogger.info(`Server started`, {
    port: PORT,
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// For testing purposes
module.exports = app;