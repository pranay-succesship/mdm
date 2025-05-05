const Role = require('../models/Role');
const User = require('../models/User');
const UserRole = require('../models/UserRole');
const RolePermission = require('../models/RolePermission');
const { validationResult } = require('express-validator');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    
    res.status(200).json({
      status: 'success',
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching roles'
    });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private/Admin
exports.getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: role
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching role'
    });
  }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    
    // Check if role already exists
    const roleExists = await Role.findOne({ name });
    if (roleExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Role with this name already exists'
      });
    }
    
    // Create role
    const role = await Role.create({
      name,
      description
    });
    
    res.status(201).json({
      status: 'success',
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating role'
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    
    // Check if role exists
    let role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // If name is changing, check if new name already exists
    if (name && name !== role.name) {
      const roleExists = await Role.findOne({ name });
      if (roleExists) {
        return res.status(400).json({
          status: 'fail',
          message: 'Role with this name already exists'
        });
      }
    }
    
    // Update role
    role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating role'
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res) => {
  try {
    // Check if role exists
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Check if role is in use (assigned to users)
    const userRolesCount = await UserRole.countDocuments({ roleId: req.params.id });
    if (userRolesCount > 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot delete role that is assigned to users',
        usersCount: userRolesCount
      });
    }
    
    // Delete related role permissions
    await RolePermission.deleteMany({ roleId: req.params.id });
    
    // Delete role
    await Role.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting role'
    });
  }
};

// @desc    Get users by role
// @route   GET /api/roles/:id/users
// @access  Private/Admin
exports.getRoleUsers = async (req, res) => {
  try {
    // Check if role exists
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Find users with this role
    const userRoles = await UserRole.find({ roleId: req.params.id }).populate({
      path: 'userId',
      select: 'username email firstName lastName isActive'
    });
    
    const users = userRoles.map(ur => ur.userId);
    
    res.status(200).json({
      status: 'success',
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get role users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching users'
    });
  }
};