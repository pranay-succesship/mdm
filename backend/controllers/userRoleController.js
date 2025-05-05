const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const { validationResult } = require('express-validator');

// @desc    Get all roles for a user
// @route   GET /api/users/:userId/roles
// @access  Private/Admin
exports.getUserRoles = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Get roles for this user
    const userRoles = await UserRole.find({ userId: req.params.userId })
      .populate('roleId');
    
    const roles = userRoles.map(ur => ur.roleId);
    
    res.status(200).json({
      status: 'success',
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching roles'
    });
  }
};

// @desc    Add role to user
// @route   POST /api/users/:userId/roles
// @access  Private/Admin
exports.addRoleToUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { roleId } = req.body;
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Check if role is already assigned to user
    const roleExists = await UserRole.findOne({ userId, roleId });
    if (roleExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Role is already assigned to this user'
      });
    }
    
    // Create user-role relationship
    const userRole = await UserRole.create({
      userId,
      roleId
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        userId,
        roleId,
        username: user.username,
        roleName: role.name
      }
    });
  } catch (error) {
    console.error('Add role to user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding role to user'
    });
  }
};

// @desc    Remove role from user
// @route   DELETE /api/users/:userId/roles/:roleId
// @access  Private/Admin
exports.removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Check if role is assigned to user
    const userRole = await UserRole.findOne({
      userId,
      roleId
    });
    
    if (!userRole) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role is not assigned to this user'
      });
    }
    
    // Remove role from user
    await UserRole.findOneAndDelete({
      userId,
      roleId
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Role removed from user successfully'
    });
  } catch (error) {
    console.error('Remove role from user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while removing role from user'
    });
  }
};

// @desc    Check if user has role
// @route   GET /api/users/:userId/roles/:roleId/check
// @access  Private/Admin
exports.checkUserRole = async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Check if user has role
    const userRole = await UserRole.findOne({
      userId,
      roleId
    });
    
    const hasRole = !!userRole;
    
    res.status(200).json({
      status: 'success',
      data: {
        hasRole,
        username: user.username,
        roleName: role.name
      }
    });
  } catch (error) {
    console.error('Check user role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while checking role'
    });
  }
};