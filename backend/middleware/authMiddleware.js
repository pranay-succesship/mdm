const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const RolePermission = require('../models/RolePermission');
const Permission = require('../models/Permission');
const { getComponentLogger } = require('../utils/logger');
require('dotenv').config();

// Initialize component logger
const authLogger = getComponentLogger('auth');

// Protect routes - verify the user is logged in
exports.protect = async (req, res, next) => {
  let token;

  // Get token from Authorization header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Bearer header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Get token from cookie
    token = req.cookies.token;
  }

  // Check if token doesn't exist
  if (!token) {
    authLogger.warn('Authentication failed: No token provided', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      authLogger.warn('Authentication failed: User no longer exists', {
        userId: decoded.id,
        path: req.originalUrl,
        ip: req.ip
      });
      
      return res.status(401).json({
        status: 'fail',
        message: 'User no longer exists'
      });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Add user to request object
    req.user = user;
    
    authLogger.debug('Authentication successful', {
      userId: user._id,
      username: user.username,
      path: req.originalUrl,
      method: req.method
    });
    
    next();
  } catch (error) {
    authLogger.error('Authentication failed: Token verification error', {
      error: error.message,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    
    res.status(401).json({
      status: 'fail',
      message: 'Not authorized to access this route'
    });
  }
};

// Check if user has specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      // Get user roles
      const userRoles = await UserRole.find({ userId: req.user._id })
        .populate('roleId');

      // Extract role names from the user's roles
      const userRoleNames = userRoles.map(ur => ur.roleId.name);

      // Check if user has any of the required roles
      const hasRole = roles.some(role => userRoleNames.includes(role));

      if (!hasRole) {
        authLogger.warn('Authorization failed: Missing required role', {
          userId: req.user._id,
          username: req.user.username,
          userRoles: userRoleNames,
          requiredRoles: roles,
          path: req.originalUrl,
          method: req.method
        });
        
        return res.status(403).json({
          status: 'fail',
          message: 'Not authorized to access this route'
        });
      }
      
      authLogger.debug('Authorization successful: Role check passed', {
        userId: req.user._id,
        username: req.user.username,
        matchedRoles: roles.filter(role => userRoleNames.includes(role)),
        path: req.originalUrl
      });
      
      next();
    } catch (error) {
      authLogger.error('Authorization error: Role check failed', {
        error: error.message,
        userId: req.user?._id,
        path: req.originalUrl,
        method: req.method
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Error checking user roles'
      });
    }
  };
};

// Check if user has specific permissions
exports.hasPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      // Get user roles
      const userRoles = await UserRole.find({ userId: req.user._id });
      const roleIds = userRoles.map(ur => ur.roleId);

      // Get all role-permission assignments for user's roles
      const rolePermissions = await RolePermission.find({
        roleId: { $in: roleIds }
      }).populate('permissionId');

      // Extract permission names
      const userPermissions = rolePermissions.map(rp => rp.permissionId.name);

      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        authLogger.warn('Authorization failed: Missing required permission', {
          userId: req.user._id,
          username: req.user.username,
          userPermissions,
          requiredPermissions: permissions,
          path: req.originalUrl,
          method: req.method
        });
        
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have the required permissions'
        });
      }
      
      authLogger.debug('Authorization successful: Permission check passed', {
        userId: req.user._id,
        username: req.user.username,
        matchedPermissions: permissions.filter(perm => userPermissions.includes(perm)),
        path: req.originalUrl
      });
      
      next();
    } catch (error) {
      authLogger.error('Authorization error: Permission check failed', {
        error: error.message,
        userId: req.user?._id,
        path: req.originalUrl,
        method: req.method
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Error checking user permissions'
      });
    }
  };
};