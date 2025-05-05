const mongoose = require('mongoose');
const { getComponentLogger } = require('../utils/logger');
require('dotenv').config();

const dbLogger = getComponentLogger('database');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    dbLogger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log database events
    mongoose.connection.on('error', err => {
      dbLogger.error('MongoDB connection error', { error: err });
    });
    
    mongoose.connection.on('disconnected', () => {
      dbLogger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      dbLogger.info('MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    dbLogger.error(`MongoDB connection error`, { error });
    process.exit(1);
  }
};

module.exports = connectDB;