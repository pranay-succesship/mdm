const Entity = require('../models/Entity');
const { validationResult } = require('express-validator');
const { getComponentLogger } = require('../utils/logger');

// Initialize component logger
const entityLogger = getComponentLogger('entityController');

/**
 * @desc    Get all entities with filtering options
 * @route   GET /api/entities
 * @access  Private
 */
exports.getEntities = async (req, res) => {
  try {
    const { search, active, limit = 10, page = 1 } = req.query;
    let query = {};
    
    // Apply search filter if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Apply active filter if provided
    if (active !== undefined) {
      query['derivedRecordConfig.activation.entityActive'] = active === 'true';
    }
    
    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    entityLogger.debug('Fetching entities list', { 
      filters: { search, active },
      pagination: { page, limit }
    });
    
    // Get entities with filtering, sorting, and pagination
    const entities = await Entity.find(query)
      .select('-schemaDefinition.properties') // Exclude large schema properties for list view
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email'); // Get creator details
      
    // Get total count for pagination info
    const total = await Entity.countDocuments(query);
    
    entityLogger.info('Entities fetched successfully', {
      count: entities.length,
      total,
      userId: req.user._id
    });
    
    res.status(200).json({
      status: 'success',
      count: entities.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
      data: entities
    });
  } catch (error) {
    entityLogger.error('Error fetching entities', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching entities'
    });
  }
};

/**
 * @desc    Get single entity by ID
 * @route   GET /api/entities/:id
 * @access  Private
 */
exports.getEntityById = async (req, res) => {
  try {
    entityLogger.debug('Fetching entity by ID', { 
      entityId: req.params.id,
      userId: req.user._id
    });
    
    const entity = await Entity.findById(req.params.id)
      .populate('createdBy', 'username email');
      
    if (!entity) {
      entityLogger.warn('Entity not found', {
        entityId: req.params.id,
        userId: req.user._id
      });
      
      return res.status(404).json({
        status: 'fail',
        message: 'Entity not found'
      });
    }
    
    entityLogger.debug('Entity fetched successfully', {
      entityId: entity._id,
      entityCode: entity.code,
      userId: req.user._id
    });
    
    res.status(200).json({
      status: 'success',
      data: entity
    });
  } catch (error) {
    entityLogger.error('Error fetching entity by ID', {
      error: error.message,
      stack: error.stack,
      entityId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching entity'
    });
  }
};

/**
 * @desc    Get single entity by code
 * @route   GET /api/entities/code/:code
 * @access  Private
 */
exports.getEntityByCode = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    
    entityLogger.debug('Fetching entity by code', { 
      entityCode: code,
      userId: req.user._id
    });
    
    const entity = await Entity.findOne({ code })
      .populate('createdBy', 'username email');
      
    if (!entity) {
      entityLogger.warn('Entity not found by code', {
        entityCode: code,
        userId: req.user._id
      });
      
      return res.status(404).json({
        status: 'fail',
        message: 'Entity not found'
      });
    }
    
    entityLogger.debug('Entity fetched successfully by code', {
      entityId: entity._id,
      entityCode: entity.code,
      userId: req.user._id
    });
    
    res.status(200).json({
      status: 'success',
      data: entity
    });
  } catch (error) {
    entityLogger.error('Error fetching entity by code', {
      error: error.message,
      stack: error.stack,
      entityCode: req.params.code,
      userId: req.user?._id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching entity'
    });
  }
};

/**
 * @desc    Create a new entity
 * @route   POST /api/entities
 * @access  Private
 */
exports.createEntity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      entityLogger.warn('Entity creation validation failed', {
        errors: errors.array(),
        userId: req.user?._id,
        entityCode: req.body.code
      });
      
      return res.status(400).json({ 
        status: 'fail',
        errors: errors.array() 
      });
    }
    
    // Set the creator to the current user
    req.body.createdBy = req.user._id;
    
    // Ensure code is uppercase
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }
    
    entityLogger.debug('Creating new entity', {
      entityCode: req.body.code,
      entityName: req.body.name,
      userId: req.user._id
    });
    
    // Check if entity with the same code already exists
    const existingEntity = await Entity.findOne({ code: req.body.code });
    if (existingEntity) {
      entityLogger.warn('Entity creation failed: Code already exists', {
        entityCode: req.body.code,
        userId: req.user._id
      });
      
      return res.status(400).json({
        status: 'fail',
        message: `Entity with code '${req.body.code}' already exists`
      });
    }
    
    // Initialize entity data with direct fields
    const entityData = {
      code: req.body.code,
      name: req.body.name,
      description: req.body.description,
      createdBy: req.body.createdBy,
    };
    
    // Handle derivedRecordConfig: use it directly if provided, otherwise build from other fields
    if (req.body.derivedRecordConfig) {
      entityData.derivedRecordConfig = req.body.derivedRecordConfig;
    } else {
      // Fallback to legacy format
      entityData.derivedRecordConfig = {
        activation: {
          enabled: req.body.config?.enableActivation !== undefined ? req.body.config.enableActivation : true,
          defaultState: req.body.config?.defaultActivationState !== undefined ? req.body.config.defaultActivationState : true,
          entityActive: req.body.isActive !== undefined ? req.body.isActive : true,
          useTimeBounding: req.body.config?.enableRecordLocking || false
        },
        versioning: {
          enabled: req.body.config?.enableVersioning || false
        },
        hierarchy: {
          enabled: req.body.config?.enableHierarchy || false,
          parentLinkField: req.body.config?.parentLinkField || 'parentId',
          linkType: req.body.config?.linkType || '_id'
        }
      };
    }
    
    // Handle schema definition
    if (req.body.schemaDefinition) {
      entityData.schemaDefinition = req.body.schemaDefinition;
    } else if (req.body.schema) {
      entityData.schemaDefinition = {
        type: req.body.schema.type || 'object',
        properties: req.body.schema.properties || {},
        required: req.body.schema.required || []
      };
    } else {
      entityData.schemaDefinition = {
        type: 'object',
        properties: {},
        required: []
      };
    }
    
    // Create the new entity
    const entity = await Entity.create(entityData);
    
    entityLogger.info('Entity created successfully', {
      entityId: entity._id,
      entityCode: entity.code,
      entityName: entity.name,
      userId: req.user._id,
      versioning: entity.derivedRecordConfig.versioning.enabled,
      hierarchy: entity.derivedRecordConfig.hierarchy.enabled
    });
    
    res.status(201).json({
      status: 'success',
      data: entity
    });
  } catch (error) {
    entityLogger.error('Entity creation error', {
      error: error.message,
      stack: error.stack,
      entityCode: req.body?.code,
      userId: req.user?._id
    });
    
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating entity'
    });
  }
};

/**
 * @desc    Update an entity
 * @route   PUT /api/entities/:id
 * @access  Private
 */
exports.updateEntity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      entityLogger.warn('Entity update validation failed', {
        errors: errors.array(),
        entityId: req.params.id,
        userId: req.user?._id
      });
      
      return res.status(400).json({ 
        status: 'fail',
        errors: errors.array() 
      });
    }
    
    // Remove code from update payload (immutable)
    if (req.body.code) {
      entityLogger.warn('Attempted to modify immutable code field', {
        entityId: req.params.id,
        userId: req.user._id,
        attemptedCode: req.body.code
      });
      delete req.body.code;
    }
    
    entityLogger.debug('Updating entity', {
      entityId: req.params.id,
      userId: req.user._id
    });
    
    const entity = await Entity.findById(req.params.id);
    
    if (!entity) {
      entityLogger.warn('Entity update failed: Entity not found', {
        entityId: req.params.id,
        userId: req.user._id
      });
      
      return res.status(404).json({
        status: 'fail',
        message: 'Entity not found'
      });
    }
    
    // Check if updating versioning/hierarchy flags which should be immutable once set to true
    if (entity.derivedRecordConfig.versioning.enabled && 
        req.body.derivedRecordConfig?.versioning?.enabled === false) {
      
      entityLogger.warn('Entity update failed: Attempted to disable versioning', {
        entityId: entity._id,
        entityCode: entity.code,
        userId: req.user._id
      });
      
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot disable versioning once it has been enabled'
      });
    }
    
    if (entity.derivedRecordConfig.hierarchy.enabled && 
        req.body.derivedRecordConfig?.hierarchy?.enabled === false) {
      
      entityLogger.warn('Entity update failed: Attempted to disable hierarchy', {
        entityId: entity._id,
        entityCode: entity.code,
        userId: req.user._id
      });
      
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot disable hierarchy once it has been enabled'
      });
    }
    
    // Update the entity
    const updatedEntity = await Entity.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'username email');
    
    entityLogger.info('Entity updated successfully', {
      entityId: updatedEntity._id,
      entityCode: updatedEntity.code,
      entityName: updatedEntity.name,
      userId: req.user._id,
      fieldsUpdated: Object.keys(req.body)
    });
    
    res.status(200).json({
      status: 'success',
      data: updatedEntity
    });
  } catch (error) {
    entityLogger.error('Entity update error', {
      error: error.message,
      stack: error.stack,
      entityId: req.params.id,
      userId: req.user?._id
    });
    
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating entity'
    });
  }
};

/**
 * @desc    Set entity activation status
 * @route   PATCH /api/entities/:id/toggle-activation
 * @access  Private
 */
exports.toggleEntityActivation = async (req, res) => {
  try {
    entityLogger.debug('Toggling entity activation status', {
      entityId: req.params.id,
      userId: req.user._id
    });
    
    const entity = await Entity.findById(req.params.id);
    if (!entity) {
      entityLogger.warn('Entity activation toggle failed: Entity not found', {
        entityId: req.params.id,
        userId: req.user._id
      });
      
      return res.status(404).json({
        status: 'fail',
        message: 'Entity not found'
      });
    }
    
    // Toggle the activation status
    const previousStatus = entity.derivedRecordConfig.activation.entityActive;
    entity.derivedRecordConfig.activation.entityActive = !previousStatus;
    await entity.save();
    
    entityLogger.info('Entity activation status toggled', {
      entityId: entity._id,
      entityCode: entity.code,
      previousStatus,
      newStatus: entity.derivedRecordConfig.activation.entityActive,
      userId: req.user._id
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        id: entity._id,
        code: entity.code,
        entityActive: entity.derivedRecordConfig.activation.entityActive
      }
    });
  } catch (error) {
    entityLogger.error('Error toggling entity activation', {
      error: error.message,
      stack: error.stack,
      entityId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while toggling entity activation'
    });
  }
};

/**
 * @desc    Delete an entity
 * @route   DELETE /api/entities/:id
 * @access  Private (Admin only)
 */
exports.deleteEntity = async (req, res) => {
  try {
    entityLogger.debug('Attempting to delete entity', {
      entityId: req.params.id,
      userId: req.user._id
    });
    
    const entity = await Entity.findById(req.params.id);
    
    if (!entity) {
      entityLogger.warn('Entity deletion failed: Entity not found', {
        entityId: req.params.id,
        userId: req.user._id
      });
      
      return res.status(404).json({
        status: 'fail',
        message: 'Entity not found'
      });
    }
    
    // Perform the deletion
    await Entity.findByIdAndDelete(req.params.id);
    
    entityLogger.info('Entity deleted successfully', {
      entityId: entity._id,
      entityCode: entity.code,
      entityName: entity.name,
      userId: req.user._id
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Entity deleted successfully'
    });
  } catch (error) {
    entityLogger.error('Entity deletion error', {
      error: error.message,
      stack: error.stack,
      entityId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting entity'
    });
  }
};

/**
 * @desc    Get schema definition for a specific entity
 * @route   GET /api/entities/:id/schema
 * @access  Private
 */
exports.getEntitySchema = async (req, res) => {
  try {
    entityLogger.debug('Fetching entity schema', {
      entityId: req.params.id,
      userId: req.user._id
    });
    
    const entity = await Entity.findById(req.params.id);
    
    if (!entity) {
      entityLogger.warn('Entity schema fetch failed: Entity not found', {
        entityId: req.params.id,
        userId: req.user._id
      });
      
      return res.status(404).json({
        status: 'fail',
        message: 'Entity not found'
      });
    }
    
    entityLogger.debug('Entity schema fetched successfully', {
      entityId: entity._id,
      entityCode: entity.code,
      userId: req.user._id
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        entityCode: entity.code,
        entityName: entity.name,
        schemaDefinition: entity.schemaDefinition,
        derivedRecordConfig: entity.derivedRecordConfig
      }
    });
  } catch (error) {
    entityLogger.error('Error fetching entity schema', {
      error: error.message,
      stack: error.stack,
      entityId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching entity schema'
    });
  }
};