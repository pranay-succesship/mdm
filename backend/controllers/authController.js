const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { getComponentLogger } = require('../utils/logger');
require('dotenv').config();

// Initialize component logger
const authLogger = getComponentLogger('authController');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      authLogger.warn('Registration validation failed', {
        errors: errors.array(),
        email: req.body.email
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      authLogger.warn('Registration failed: User already exists', {
        email,
        username
      });
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email or username already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      isActive: true,
      emailVerified: false // By default, set to false. Email verification can be implemented later
    });

    // Check if a default "user" role exists; if not, create it
    let userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      userRole = await Role.create({
        name: 'user',
        description: 'Regular user with basic privileges'
      });
      authLogger.info('Created default user role');
    }

    // Assign the user role to the newly created user
    await UserRole.create({
      userId: user._id,
      roleId: userRole._id
    });

    // Generate token
    const token = generateToken(user._id);

    // Return token with user data (exclude password)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      emailVerified: user.emailVerified
    };

    // Set token cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Secure in production
    });

    authLogger.info('User registered successfully', {
      userId: user._id,
      username,
      email,
      ip: req.ip
    });

    res.status(201).json({
      status: 'success',
      token,
      data: userResponse
    });
  } catch (error) {
    authLogger.error('Registration error', {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      authLogger.warn('Login validation failed', {
        errors: errors.array(),
        email: req.body.email
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      authLogger.warn('Login failed: Invalid credentials', {
        email,
        ip: req.ip,
        exists: !!user
      });
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      authLogger.warn('Login failed: Account deactivated', {
        userId: user._id,
        email,
        ip: req.ip
      });
      return res.status(401).json({
        status: 'fail',
        message: 'Your account is deactivated. Please contact support.'
      });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    // Return token with user data (without password)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      emailVerified: user.emailVerified
    };

    // Set token cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Secure in production
    });

    authLogger.info('User logged in successfully', {
      userId: user._id,
      username: user.username,
      email,
      ip: req.ip
    });

    res.status(200).json({
      status: 'success',
      token,
      data: userResponse
    });
  } catch (error) {
    authLogger.error('Login error', {
      error: error.message,
      stack: error.stack,
      email: req.body.email,
      ip: req.ip
    });
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  // Clear cookie
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
  });
  
  authLogger.info('User logged out', {
    userId: req.user?._id,
    username: req.user?.username
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // User is already available in req due to the protect middleware
    const user = req.user;

    // Get user roles
    const userRoles = await UserRole.find({ userId: user._id }).populate('roleId');
    const roles = userRoles.map(ur => ur.roleId.name);

    authLogger.debug('User profile accessed', {
      userId: user._id,
      username: user.username
    });

    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    authLogger.error('Get user profile error', {
      error: error.message,
      userId: req.user?._id
    });
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user data'
    });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      authLogger.warn('Password update validation failed', {
        errors: errors.array(),
        userId: req.user?._id
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      authLogger.warn('Password update failed: Incorrect current password', {
        userId: user._id,
        username: user.username
      });
      return res.status(401).json({
        status: 'fail',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new token
    const token = generateToken(user._id);
    
    // Set token cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Secure in production
    });
    
    authLogger.info('Password updated successfully', {
      userId: user._id,
      username: user.username
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
      token
    });
  } catch (error) {
    authLogger.error('Password update error', {
      error: error.message,
      userId: req.user?._id
    });
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating password'
    });
  }
};