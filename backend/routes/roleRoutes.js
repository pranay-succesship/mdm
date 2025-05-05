const express = require('express');
const { check } = require('express-validator');
const roleController = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Apply authorization middleware - only admins can manage roles
router.use(authorize('admin'));

// Routes for role management
router.route('/')
  .get(roleController.getRoles)
  .post(
    [
      check('name', 'Role name is required').not().isEmpty(),
    ],
    roleController.createRole
  );

router.route('/:id')
  .get(roleController.getRole)
  .put(
    [
      check('name', 'Role name is required').not().isEmpty(),
    ],
    roleController.updateRole
  )
  .delete(roleController.deleteRole);

// Get users with specific role
router.get('/:id/users', roleController.getRoleUsers);

module.exports = router;