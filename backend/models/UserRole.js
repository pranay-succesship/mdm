const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure user can have a role only once
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

module.exports = mongoose.model('UserRole', userRoleSchema);