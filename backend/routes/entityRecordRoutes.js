const express = require('express');
const { check } = require('express-validator');
const entityRecordController = require('../controllers/entityRecordController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

const router = express.Router();

// All entity record routes require authentication
router.use(protect);

// Get all records for a specific entity type
router.get('/:entityCode',
  hasPermission('view_entity_records'),
  entityRecordController.getEntityRecords
);

// Create a new record for a specific entity type
router.post('/:entityCode',
  [
    check('data').notEmpty().withMessage('Record data is required')
  ],
  hasPermission('create_entity_record'),
  entityRecordController.createEntityRecord
);

// Get versions of a specific record
router.get('/:entityCode/:id/versions',
  hasPermission('view_entity_records'),
  entityRecordController.getEntityRecordVersions
);

// Toggle activation status of an entity record
router.patch('/:entityCode/:id/toggle-activation',
  hasPermission('edit_entity_record'),
  entityRecordController.toggleEntityRecordActivation
);

// Standard CRUD operations for a specific record
router.route('/:entityCode/:id')
  .get(
    hasPermission('view_entity_records'),
    entityRecordController.getEntityRecordById
  )
  .put(
    [
      check('data').optional().notEmpty().withMessage('Record data cannot be empty if provided')
    ],
    hasPermission('edit_entity_record'),
    entityRecordController.updateEntityRecord
  )
  .delete(
    hasPermission('delete_entity_record'),
    entityRecordController.deleteEntityRecord
  );

module.exports = router;