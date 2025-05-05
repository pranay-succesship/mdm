const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const { validationResult } = require('express-validator');

// @desc    Get all permissions for a role
// @route   GET /api/roles/:roleId/permissions
// @access  Private/Admin
exports.getRolePermissions = async (req, res) => {
  try {
    // Check if role exists
    const role = await Role.findById(req.params.roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Get permissions for this role
    const rolePermissions = await RolePermission.find({ roleId: req.params.roleId })
      .populate('permissionId');
    
    const permissions = rolePermissions.map(rp => rp.permissionId);
    
    res.status(200).json({
      status: 'success',
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching permissions'
    });
  }
};

// @desc    Add permission to role
// @route   POST /api/roles/:roleId/permissions
// @access  Private/Admin
exports.addPermissionToRole = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { permissionId } = req.body;
    const { roleId } = req.params;
    
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Check if permission exists
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Check if permission is already assigned to role
    const permissionExists = await RolePermission.findOne({ 
      roleId, 
      permissionId 
    });
    
    if (permissionExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Permission is already assigned to this role'
      });
    }
    
    // Create role-permission relationship
    const rolePermission = await RolePermission.create({
      roleId,
      permissionId
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        roleId,
        permissionId,
        roleName: role.name,
        permissionName: permission.name
      }
    });
  } catch (error) {
    console.error('Add permission to role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding permission to role'
    });
  }
};

// @desc    Remove permission from role
// @route   DELETE /api/roles/:roleId/permissions/:permissionId
// @access  Private/Admin
exports.removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Check if permission exists
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Check if permission is assigned to role
    const rolePermission = await RolePermission.findOne({
      roleId,
      permissionId
    });
    
    if (!rolePermission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission is not assigned to this role'
      });
    }
    
    // Remove permission from role
    await RolePermission.findOneAndDelete({
      roleId,
      permissionId
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Permission removed from role successfully'
    });
  } catch (error) {
    console.error('Remove permission from role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while removing permission from role'
    });
  }
};

// @desc    Check if role has permission
// @route   GET /api/roles/:roleId/permissions/:permissionId/check
// @access  Private/Admin
exports.checkRolePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Check if permission exists
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Check if permission is assigned to role
    const rolePermission = await RolePermission.findOne({
      roleId,
      permissionId
    });
    
    const hasPermission = !!rolePermission;
    
    res.status(200).json({
      status: 'success',
      data: {
        hasPermission,
        roleName: role.name,
        permissionName: permission.name
      }
    });
  } catch (error) {
    console.error('Check role permission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while checking permission'
    });
  }
};