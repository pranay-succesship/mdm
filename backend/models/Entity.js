const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getComponentLogger } = require('../utils/logger');
const logUtils = require('../utils/logUtils');

// Initialize component logger
const entityModelLogger = getComponentLogger('entityModel');

const entitySchema = new Schema({
    /**
     * Unique, machine-readable identifier for the entity type.
     * Recommendations: UPPERCASE, SNAKE_CASE, no spaces.
     * CRITICAL: Should be treated as IMMUTABLE after creation.
     */
    code: {
        type: String,
        required: [true, 'Entity code is required.'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
        match: [/^[A-Z0-9_]+$/, 'Entity code must be uppercase alphanumeric with underscores only']
    },

    /**
     * Human-readable name for the entity type (e.g., "Country", "Product Category").
     */
    name: {
        type: String,
        required: [true, 'Entity name is required.'],
        trim: true,
    },

    /**
     * Optional description providing context about the entity type.
     */
    description: {
        type: String,
        trim: true,
    },

    /**
     * Configuration object defining how derived records behave.
     */
    derivedRecordConfig: {
        _id: false, // Don't create a separate _id for this subdocument
        activation: {
            _id: false,
            /** If true, derived records will have an 'isActive' field. */
            enabled: { type: Boolean, default: true },
            /** Default 'isActive' state for newly created derived records. */
            defaultState: { type: Boolean, default: true },
            /** If true, entity is active and usable in the system. */
            entityActive: { type: Boolean, default: true, index: true },
            /** If true, derived records include 'effectiveFrom' and 'effectiveTo' fields. */
            useTimeBounding: { type: Boolean, default: false },
        },
        versioning: {
            _id: false,
            /** If true, enables versioning logic (adds version, isCurrent, expiredAt). */
            enabled: { type: Boolean, default: false },
            // IMMUTABILITY NOTE: Changing this after derived data exists is complex. Should ideally be immutable post-creation or require a migration.
        },
        hierarchy: {
            _id: false,
            /** If true, enables parent-child relationships (adds parent link field). */
            enabled: { type: Boolean, default: false },
            // IMMUTABILITY NOTE: Changing this after derived data exists is complex. Should ideally be immutable post-creation or require a migration.
            /** Name of the field storing the parent link in derived records. */
            parentLinkField: { type: String, default: 'parentId', trim: true },
            /** How the parent is referenced: by its database _id (specific version) or business code (logical parent). */
            linkType: { type: String, enum: ['_id', 'code'], default: '_id' },
        },
    },

    /**
     * Defines the custom data fields for derived records using a JSON Schema subset.
     * VALIDATION NOTE: Implement pre-save/update hooks to validate this structure is usable/valid JSON Schema.
     */
    schemaDefinition: {
        _id: false,
        type: { type: String, default: 'object' },
        /** Key: fieldName, Value: JSON Schema field definition (type, validation). */
        properties: { type: Schema.Types.Mixed, default: {} },
        /** Array of field names from 'properties' that are mandatory. */
        required: { type: [String], default: [] },
    },

    /**
     * Reference to the User who created this entity definition.
     */
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Assumes a 'User' model exists
        required: true,
    },

}, {
    /**
     * Automatically add 'createdAt' and 'updatedAt' timestamps for the entity definition itself.
     */
    timestamps: true,
});

// Text index for searching entities by name/description
entitySchema.index({ name: 'text', description: 'text' });

// Pre-save hook to enforce code immutability and add logging
entitySchema.pre('save', async function(next) {
    try {
        // If this is an existing entity (not new)
        if (!this.isNew) {
            // Check if code is being modified
            if (this.isModified('code')) {
                entityModelLogger.warn('Attempted to modify immutable entity code', {
                    entityId: this._id,
                    entityCode: this.code,
                    modifiedBy: this.createdBy // Note: This should ideally be the current user
                });
                
                this.invalidate('code', 'Entity code cannot be modified after creation');
                return next(new Error('Entity code cannot be modified after creation'));
            }
            
            // Log significant changes
            if (this.isModified('name') || this.isModified('description')) {
                entityModelLogger.info('Entity metadata updated', {
                    entityId: this._id,
                    entityCode: this.code,
                    nameChanged: this.isModified('name'),
                    descriptionChanged: this.isModified('description')
                });
            }
            
            // Log configuration changes
            if (this.isModified('derivedRecordConfig')) {
                entityModelLogger.info('Entity configuration updated', {
                    entityId: this._id,
                    entityCode: this.code,
                    activationChanged: this.isModified('derivedRecordConfig.activation'),
                    versioningChanged: this.isModified('derivedRecordConfig.versioning'),
                    hierarchyChanged: this.isModified('derivedRecordConfig.hierarchy')
                });
            }
            
            // Log schema changes
            if (this.isModified('schemaDefinition')) {
                entityModelLogger.info('Entity schema updated', {
                    entityId: this._id,
                    entityCode: this.code,
                    propertiesChanged: this.isModified('schemaDefinition.properties'),
                    requiredFieldsChanged: this.isModified('schemaDefinition.required')
                });
            }
        } else {
            // It's a new entity being created
            entityModelLogger.info('New entity created', {
                entityCode: this.code,
                name: this.name,
                createdBy: this.createdBy,
                hasVersioning: this.derivedRecordConfig.versioning.enabled,
                hasHierarchy: this.derivedRecordConfig.hierarchy.enabled
            });
        }
        
        next();
    } catch (error) {
        entityModelLogger.error('Error in entity pre-save hook', {
            error: error.message,
            stack: error.stack,
            entityCode: this.code
        });
        next(error);
    }
});

// Pre-update hook to prevent code modification and log updates
entitySchema.pre('findOneAndUpdate', function(next) {
    try {
        const update = this._update;
        
        if (update && update.code) {
            entityModelLogger.warn('Attempted to modify immutable entity code via update', {
                filter: this._conditions,
                attemptedCode: update.code
            });
            
            return next(new Error('Entity code cannot be modified after creation'));
        }
        
        // Log update operation if it contains significant changes
        if (update) {
            const significantChanges = {};
            
            if (update.name || update.description) {
                significantChanges.metadata = true;
            }
            
            if (update.derivedRecordConfig) {
                significantChanges.configuration = true;
            }
            
            if (update.schemaDefinition) {
                significantChanges.schema = true;
            }
            
            if (Object.keys(significantChanges).length > 0) {
                entityModelLogger.info('Entity update operation', {
                    filter: this._conditions,
                    changes: significantChanges
                });
                
                // This would be better with logUtils, but we don't have user context here
                // Could be enhanced by passing user through the update options
            }
        }
        
        next();
    } catch (error) {
        entityModelLogger.error('Error in entity pre-update hook', {
            error: error.message,
            filter: this._conditions
        });
        next(error);
    }
});

// Post-remove hook to log entity deletion
entitySchema.post('remove', function(doc) {
    entityModelLogger.info('Entity deleted', {
        entityId: doc._id,
        entityCode: doc.code,
        entityName: doc.name
    });
    
    // This would be better with logUtils.logDbOperation, 
    // but we don't have user context here
});

// Validation for schemaDefinition
entitySchema.pre('validate', function(next) {
    try {
        // Basic validation of schema structure
        if (this.schemaDefinition && typeof this.schemaDefinition.properties !== 'object') {
            entityModelLogger.warn('Schema validation failed: properties must be an object', {
                entityCode: this.code
            });
            
            return next(new Error('Schema properties must be an object'));
        }
        
        // Check that required fields are defined in properties
        if (this.schemaDefinition && Array.isArray(this.schemaDefinition.required)) {
            for (const field of this.schemaDefinition.required) {
                if (!this.schemaDefinition.properties[field]) {
                    entityModelLogger.warn('Schema validation failed: required field missing from properties', {
                        entityCode: this.code,
                        missingField: field
                    });
                    
                    return next(new Error(`Required field '${field}' is not defined in properties`));
                }
            }
        }
        
        next();
    } catch (error) {
        entityModelLogger.error('Error in entity validation', {
            error: error.message,
            stack: error.stack,
            entityCode: this.code
        });
        next(error);
    }
});

module.exports = mongoose.model('Entity', entitySchema);