const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const { validationResult } = require('express-validator');

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private/Admin
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    
    res.status(200).json({
      status: 'success',
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching permissions'
    });
  }
};

// @desc    Get single permission
// @route   GET /api/permissions/:id
// @access  Private/Admin
exports.getPermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: permission
    });
  } catch (error) {
    console.error('Get permission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching permission'
    });
  }
};

// @desc    Create new permission
// @route   POST /api/permissions
// @access  Private/Admin
exports.createPermission = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    
    // Check if permission already exists
    const permissionExists = await Permission.findOne({ name });
    if (permissionExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Permission with this name already exists'
      });
    }
    
    // Create permission
    const permission = await Permission.create({
      name,
      description
    });
    
    res.status(201).json({
      status: 'success',
      data: permission
    });
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating permission'
    });
  }
};

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Private/Admin
exports.updatePermission = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    
    // Check if permission exists
    let permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // If name is changing, check if new name already exists
    if (name && name !== permission.name) {
      const permissionExists = await Permission.findOne({ name });
      if (permissionExists) {
        return res.status(400).json({
          status: 'fail',
          message: 'Permission with this name already exists'
        });
      }
    }
    
    // Update permission
    permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { name, description, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: permission
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating permission'
    });
  }
};

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Private/Admin
exports.deletePermission = async (req, res) => {
  try {
    // Check if permission exists
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Check if permission is in use (assigned to roles)
    const rolePermissionsCount = await RolePermission.countDocuments({ permissionId: req.params.id });
    if (rolePermissionsCount > 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot delete permission that is assigned to roles',
        rolesCount: rolePermissionsCount
      });
    }
    
    // Delete permission
    await Permission.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting permission'
    });
  }
};