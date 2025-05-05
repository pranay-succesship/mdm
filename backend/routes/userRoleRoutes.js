const express = require('express');
const { check } = require('express-validator');
const userRoleController = require('../controllers/userRoleController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(protect);

// Apply authorization middleware - only admins can manage user roles
router.use(authorize('admin'));

// Get all roles for a user
router.get('/', userRoleController.getUserRoles);

// Add role to user
router.post('/',
  [
    check('roleId', 'Role ID is required').isMongoId(),
  ],
  userRoleController.addRoleToUser
);

// Remove role from user
router.delete('/:roleId', userRoleController.removeRoleFromUser);

// Check if user has role
router.get('/:roleId/check', userRoleController.checkUserRole);

module.exports = router;