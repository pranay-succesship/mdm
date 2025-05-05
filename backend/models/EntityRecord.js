const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entityRecordSchema = new Schema({
  entityId: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: [true, 'Entity ID is required']
  },
  entityCode: {
    type: String,
    required: [true, 'Entity code is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  // The actual data stored in this record, structure depends on entity type schema
  data: {
    type: Schema.Types.Mixed,
    required: [true, 'Record data is required']
  },
  // Activation status of the record (if enabled in entity config)
  isActive: {
    type: Boolean,
    default: true
  },
  // Time-bounding for record validity (if enabled in entity config)
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  // Versioning fields (if enabled in entity config)
  version: {
    type: Number,
    default: 1
  },
  isCurrent: {
    type: Boolean,
    default: true,
    index: true
  },
  expiredAt: {
    type: Date,
    default: null
  },
  // Audit fields
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for faster fetching of entity records
entityRecordSchema.index({ entityId: 1, isCurrent: 1 });
entityRecordSchema.index({ entityCode: 1, isCurrent: 1 });

// Text index for searching within the data object
// Note: MongoDB only allows one text index per collection
entityRecordSchema.index({ 'data': 'text' });

// Custom validation - if we're using time-bounding, effectiveTo must be > effectiveFrom if provided
entityRecordSchema.pre('validate', function(next) {
  if (this.effectiveFrom && this.effectiveTo) {
    if (this.effectiveFrom >= this.effectiveTo) {
      this.invalidate('effectiveTo', 'Effective end date must be after effective start date');
    }
  }
  next();
});

// Pre-save hook for additional processing
entityRecordSchema.pre('save', function(next) {
  // Additional processing could happen here like:
  // - Schema validation against entity type's schemaDefinition
  // - Handling versioning logic
  next();
});

// Virtual for hierarchical relationship if enabled
// This is just a placeholder - actual implementation would depend on
// specific hierarchy configuration from entity type
entityRecordSchema.virtual('children', {
  ref: 'EntityRecord',
  localField: '_id',
  foreignField: 'parent', // This would be dynamic based on entity config
  justOne: false
});

const EntityRecord = mongoose.model('EntityRecord', entityRecordSchema);

module.exports = EntityRecord;