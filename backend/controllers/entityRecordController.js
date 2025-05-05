const EntityRecord = require('../models/EntityRecord');
const Entity = require('../models/Entity');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * @desc    Get all records for a specific entity
 * @route   GET /api/entity-records/:entityCode
 * @access  Private
 */
exports.getEntityRecords = async (req, res) => {
  try {
    const { entityCode } = req.params;
    const { search, currentOnly = 'true', active, limit = 20, page = 1 } = req.query;
    
    // Build the query
    let query = { entityCode: entityCode.toUpperCase() };
    
    // Apply current version filter if versioning is enabled
    if (currentOnly === 'true') {
      query.isCurrent = true;
    }
    
    // Apply active filter if provided
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    // Apply search if provided
    if (search) {
      // Search in the data object - this requires a text index on the data field
      query.$text = { $search: search };
    }
    
    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch the entity definition first to check if it exists
    const entity = await Entity.findOne({ code: entityCode.toUpperCase() });
    if (!entity) {
      return res.status(404).json({
        status: 'fail',
        message: `Entity with code ${entityCode} not found`
      });
    }
    
    // Get records with filtering, sorting, and pagination
    const records = await EntityRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
      
    // Get total count for pagination info
    const total = await EntityRecord.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      count: records.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
      entityName: entity.name,
      data: records
    });
  } catch (error) {
    console.error('Get entity records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching entity records'
    });
  }
};

/**
 * @desc    Get a single entity record by ID
 * @route   GET /api/entity-records/:entityCode/:id
 * @access  Private
 */
exports.getEntityRecordById = async (req, res) => {
  try {
    const { entityCode, id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid ID format'
      });
    }
    
    // Find the record
    const record = await EntityRecord.findOne({
      _id: id,
      entityCode: entityCode.toUpperCase()
    })
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');
    
    if (!record) {
      return res.status(404).json({
        status: 'fail',
        message: 'Entity record not found'
      });
    }
    
    // Get the entity definition for additional context
    const entity = await Entity.findById(record.entityId);
    
    res.status(200).json({
      status: 'success',
      entityName: entity ? entity.name : 'Unknown',
      data: record
    });
  } catch (error) {
    console.error('Get entity record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching entity record'
    });
  }
};

/**
 * @desc    Create a new entity record
 * @route   POST /api/entity-records/:entityCode
 * @access  Private
 */
exports.createEntityRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }
    
    const { entityCode } = req.params;
    
    // Find the entity definition
    const entity = await Entity.findOne({ code: entityCode.toUpperCase() });
    
    if (!entity) {
      return res.status(404).json({
        status: 'fail',
        message: `Entity with code ${entityCode} not found`
      });
    }
    
    // Check if the entity is active
    if (!entity.entityIsActive) {
      return res.status(400).json({
        status: 'fail',
        message: `Entity ${entity.name} is currently inactive and cannot accept new records`
      });
    }
    
    // Set record metadata
    const recordData = {
      entityId: entity._id,
      entityCode: entity.code,
      data: req.body.data,
      createdBy: req.user._id,
      updatedBy: req.user._id
    };
    
    // Set activation based on entity configuration
    if (entity.derivedRecordConfig.activation.enabled) {
      recordData.isActive = req.body.isActive !== undefined ? 
        req.body.isActive : 
        entity.derivedRecordConfig.activation.defaultState;
    }
    
    // Set time bounding if configured
    if (entity.derivedRecordConfig.activation.useTimeBounding) {
      if (req.body.effectiveFrom) {
        recordData.effectiveFrom = new Date(req.body.effectiveFrom);
      }
      if (req.body.effectiveTo) {
        recordData.effectiveTo = new Date(req.body.effectiveTo);
      }
    }
    
    // Set hierarchy parent if configured
    if (entity.derivedRecordConfig.hierarchy.enabled && req.body.parent) {
      // The field name is dynamic based on the entity configuration
      const parentFieldName = entity.derivedRecordConfig.hierarchy.parentLinkField;
      recordData[parentFieldName] = req.body.parent;
    }
    
    // Create the record
    const record = await EntityRecord.create(recordData);
    
    res.status(201).json({
      status: 'success',
      entityName: entity.name,
      data: record
    });
  } catch (error) {
    console.error('Create entity record error:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError' || error.message.includes('Required field')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating entity record'
    });
  }
};

/**
 * @desc    Update an entity record
 * @route   PUT /api/entity-records/:entityCode/:id
 * @access  Private
 */
exports.updateEntityRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }
    
    const { entityCode, id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid ID format'
      });
    }
    
    // Find the record
    const record = await EntityRecord.findOne({
      _id: id,
      entityCode: entityCode.toUpperCase()
    });
    
    if (!record) {
      return res.status(404).json({
        status: 'fail',
        message: 'Entity record not found'
      });
    }
    
    // Find the entity definition
    const entity = await Entity.findById(record.entityId);
    
    if (!entity) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parent entity definition not found'
      });
    }
    
    // Check if the entity is active
    if (!entity.entityIsActive) {
      return res.status(400).json({
        status: 'fail',
        message: `Entity ${entity.name} is currently inactive and records cannot be updated`
      });
    }
    
    // Update the data
    if (req.body.data) {
      record.data = req.body.data;
    }
    
    // Update activation if configured
    if (entity.derivedRecordConfig.activation.enabled && req.body.isActive !== undefined) {
      record.isActive = req.body.isActive;
    }
    
    // Update time bounding if configured
    if (entity.derivedRecordConfig.activation.useTimeBounding) {
      if (req.body.effectiveFrom) {
        record.effectiveFrom = new Date(req.body.effectiveFrom);
      }
      if (req.body.effectiveTo) {
        record.effectiveTo = new Date(req.body.effectiveTo);
      }
    }
    
    // Update hierarchy parent if configured
    if (entity.derivedRecordConfig.hierarchy.enabled && req.body.parent !== undefined) {
      const parentFieldName = entity.derivedRecordConfig.hierarchy.parentLinkField;
      record[parentFieldName] = req.body.parent;
    }
    
    // Set updater
    record.updatedBy = req.user._id;
    
    // Save the updated record
    await record.save();
    
    // Reload the record to get populated references
    const updatedRecord = await EntityRecord.findById(record._id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
      
    res.status(200).json({
      status: 'success',
      entityName: entity.name,
      data: updatedRecord
    });
  } catch (error) {
    console.error('Update entity record error:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError' || error.message.includes('Required field')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating entity record'
    });
  }
};

/**
 * @desc    Toggle activation status of an entity record
 * @route   PATCH /api/entity-records/:entityCode/:id/toggle-activation
 * @access  Private
 */
exports.toggleEntityRecordActivation = async (req, res) => {
  try {
    const { entityCode, id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid ID format'
      });
    }
    
    // Find the record
    const record = await EntityRecord.findOne({
      _id: id,
      entityCode: entityCode.toUpperCase()
    });
    
    if (!record) {
      return res.status(404).json({
        status: 'fail',
        message: 'Entity record not found'
      });
    }
    
    // Find the entity definition
    const entity = await Entity.findById(record.entityId);
    
    if (!entity || !entity.derivedRecordConfig.activation.enabled) {
      return res.status(400).json({
        status: 'fail',
        message: 'Activation is not enabled for this entity type'
      });
    }
    
    // Toggle the activation status
    record.isActive = !record.isActive;
    record.updatedBy = req.user._id;
    await record.save();
    
    res.status(200).json({
      status: 'success',
      entityName: entity.name,
      data: {
        id: record._id,
        isActive: record.isActive
      }
    });
  } catch (error) {
    console.error('Toggle entity record activation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while toggling entity record activation'
    });
  }
};

/**
 * @desc    Delete an entity record
 * @route   DELETE /api/entity-records/:entityCode/:id
 * @access  Private
 */
exports.deleteEntityRecord = async (req, res) => {
  try {
    const { entityCode, id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid ID format'
      });
    }
    
    // Find the record
    const record = await EntityRecord.findOne({
      _id: id,
      entityCode: entityCode.toUpperCase()
    });
    
    if (!record) {
      return res.status(404).json({
        status: 'fail',
        message: 'Entity record not found'
      });
    }
    
    // Find the entity definition to get the name for the response
    const entity = await Entity.findById(record.entityId);
    
    // Delete the record
    await EntityRecord.deleteOne({ _id: id });
    
    res.status(200).json({
      status: 'success',
      message: 'Entity record deleted successfully',
      entityName: entity ? entity.name : 'Unknown'
    });
  } catch (error) {
    console.error('Delete entity record error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting entity record'
    });
  }
};

/**
 * @desc    Get all record versions for a specific entity record
 * @route   GET /api/entity-records/:entityCode/:id/versions
 * @access  Private
 */
exports.getEntityRecordVersions = async (req, res) => {
  try {
    const { entityCode, id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid ID format'
      });
    }
    
    // Find the current record to get its data identifier
    const currentRecord = await EntityRecord.findOne({
      _id: id,
      entityCode: entityCode.toUpperCase()
    });
    
    if (!currentRecord) {
      return res.status(404).json({
        status: 'fail',
        message: 'Entity record not found'
      });
    }
    
    // Find the entity definition
    const entity = await Entity.findById(currentRecord.entityId);
    
    if (!entity) {
      return res.status(404).json({
        status: 'fail',
        message: 'Parent entity definition not found'
      });
    }
    
    // Check if versioning is enabled
    if (!entity.derivedRecordConfig.versioning.enabled) {
      return res.status(400).json({
        status: 'fail',
        message: 'Versioning is not enabled for this entity type'
      });
    }
    
    // Get all versions of this record based on shared business key(s)
    // This is a simplified approach - in a real system you might need
    // a more sophisticated way to identify records across versions
    const businessKey = getBusinessKeyFields(entity, currentRecord.data);
    
    if (!businessKey) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot determine business key for versioning'
      });
    }
    
    // Build a query to find related versions based on business key
    const versionQuery = {
      entityCode: entityCode.toUpperCase()
    };
    
    // Add business key conditions
    for (const [key, value] of Object.entries(businessKey)) {
      versionQuery[`data.${key}`] = value;
    }
    
    // Get all versions
    const versions = await EntityRecord.find(versionQuery)
      .sort({ version: -1 })
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    res.status(200).json({
      status: 'success',
      entityName: entity.name,
      count: versions.length,
      data: versions
    });
  } catch (error) {
    console.error('Get entity record versions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching entity record versions'
    });
  }
};

/**
 * Helper function to extract business key fields from record data
 * based on entity definition
 */
function getBusinessKeyFields(entity, data) {
  if (!data) return null;
  
  // For this example, we'll use required fields as business key
  // In a real system, you might want to define explicit business keys in the schema
  const businessKey = {};
  
  if (Array.isArray(entity.schemaDefinition.required)) {
    for (const field of entity.schemaDefinition.required) {
      if (data[field] !== undefined) {
        businessKey[field] = data[field];
      }
    }
  }
  
  return Object.keys(businessKey).length > 0 ? businessKey : null;
}