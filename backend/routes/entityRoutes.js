const express = require('express');
const { check } = require('express-validator');
const entityController = require('../controllers/entityController');
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware');

const router = express.Router();

// All entity routes require authentication
router.use(protect);

// Basic entity routes - available to all authenticated users with proper permissions
router.route('/')
  .get(hasPermission('view_entities'), entityController.getEntities)
  .post(
    [
      check('code', 'Entity code is required')
        .notEmpty()
        .matches(/^[A-Z0-9_]+$/)
        .withMessage('Entity code must be uppercase alphanumeric with underscores only'),
      check('name', 'Entity name is required').notEmpty(),
    ],
    hasPermission('create_entity'),
    entityController.createEntity
  );

// Get entity by code - specifically ordered before :id route to avoid conflicts
router.get('/code/:code', 
  hasPermission('view_entities'), 
  entityController.getEntityByCode
);

// Get entity schema definition
router.get('/:id/schema', 
  hasPermission('view_entities'), 
  entityController.getEntitySchema
);

// Toggle entity activation status
router.patch('/:id/toggle-activation',
  hasPermission('edit_entity'),
  entityController.toggleEntityActivation
);

// Standard CRUD operations by ID
router.route('/:id')
  .get(hasPermission('view_entities'), entityController.getEntityById)
  .put(
    [
      check('name', 'Entity name is required if provided').optional().notEmpty(),
    ],
    hasPermission('edit_entity'),
    entityController.updateEntity
  )
  .delete(
    authorize('admin'), // Only admins can delete entities
    entityController.deleteEntity
  );

module.exports = router;