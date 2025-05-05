const express = require('express');
const { check } = require('express-validator');
const rolePermissionController = require('../controllers/rolePermissionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(protect);

// Apply authorization middleware - only admins can manage role permissions
router.use(authorize('admin'));

// Get all permissions for a role
router.get('/', rolePermissionController.getRolePermissions);

// Add permission to role
router.post('/',
  [
    check('permissionId', 'Permission ID is required').isMongoId(),
  ],
  rolePermissionController.addPermissionToRole
);

// Remove permission from role
router.delete('/:permissionId', rolePermissionController.removePermissionFromRole);

// Check if role has permission
router.get('/:permissionId/check', rolePermissionController.checkRolePermission);

module.exports = router;