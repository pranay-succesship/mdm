const express = require('express');
const { check } = require('express-validator');
const permissionController = require('../controllers/permissionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Apply authorization middleware - only admins can manage permissions
router.use(authorize('admin'));

// Routes for permission management
router.route('/')
  .get(permissionController.getPermissions)
  .post(
    [
      check('name', 'Permission name is required').not().isEmpty(),
    ],
    permissionController.createPermission
  );

router.route('/:id')
  .get(permissionController.getPermission)
  .put(
    [
      check('name', 'Permission name is required').not().isEmpty(),
    ],
    permissionController.updatePermission
  )
  .delete(permissionController.deletePermission);

module.exports = router;