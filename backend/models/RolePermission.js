const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  permissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure role can have a permission only once
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);