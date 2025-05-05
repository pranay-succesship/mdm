const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const UserRole = require('../models/UserRole');
const RolePermission = require('../models/RolePermission');

// Create default roles, permissions and admin user
const seedData = async () => {
  try {
    console.log('Checking for existing data...');
    
    // Create default roles if they don't exist
    const adminRole = await createRoleIfNotExists('admin', 'Administrator with full system access');
    const userRole = await createRoleIfNotExists('user', 'Regular user with limited access');
    const moderatorRole = await createRoleIfNotExists('moderator', 'Moderator with content management permissions');
    
    // Create default permissions if they don't exist
    // User management permissions
    const viewUsers = await createPermissionIfNotExists('view_users', 'Can view user list');
    const editUsers = await createPermissionIfNotExists('edit_users', 'Can edit user details');
    const deleteUsers = await createPermissionIfNotExists('delete_users', 'Can delete users');
    
    // Content permissions
    const createContent = await createPermissionIfNotExists('create_content', 'Can create content');
    const editContent = await createPermissionIfNotExists('edit_content', 'Can edit content');
    const deleteContent = await createPermissionIfNotExists('delete_content', 'Can delete content');
    const manageRoles = await createPermissionIfNotExists('manage_roles', 'Can manage roles and permissions');
    
    // Entity type permissions (for entity definitions)
    const viewEntities = await createPermissionIfNotExists('view_entities', 'Can view entity types');
    const createEntity = await createPermissionIfNotExists('create_entity', 'Can create entity types');
    const editEntity = await createPermissionIfNotExists('edit_entity', 'Can edit entity types');
    const deleteEntity = await createPermissionIfNotExists('delete_entity', 'Can delete entity types');
    
    // Entity record permissions (for actual data)
    const viewEntityRecords = await createPermissionIfNotExists('view_entity_records', 'Can view entity records/data');
    const createEntityRecord = await createPermissionIfNotExists('create_entity_record', 'Can create entity records/data');
    const editEntityRecord = await createPermissionIfNotExists('edit_entity_record', 'Can edit entity records/data');
    const deleteEntityRecord = await createPermissionIfNotExists('delete_entity_record', 'Can delete entity records/data');
    
    // Assign permissions to admin role
    if (adminRole) {
      // User management permissions
      await assignPermissionToRole(adminRole._id, viewUsers._id);
      await assignPermissionToRole(adminRole._id, editUsers._id);
      await assignPermissionToRole(adminRole._id, deleteUsers._id);
      
      // Content permissions
      await assignPermissionToRole(adminRole._id, createContent._id);
      await assignPermissionToRole(adminRole._id, editContent._id);
      await assignPermissionToRole(adminRole._id, deleteContent._id);
      await assignPermissionToRole(adminRole._id, manageRoles._id);
      
      // Entity type permissions - admins can do everything with entity types
      await assignPermissionToRole(adminRole._id, viewEntities._id);
      await assignPermissionToRole(adminRole._id, createEntity._id);
      await assignPermissionToRole(adminRole._id, editEntity._id);
      await assignPermissionToRole(adminRole._id, deleteEntity._id);
      
      // Entity record permissions - admins can do everything with entity records
      await assignPermissionToRole(adminRole._id, viewEntityRecords._id);
      await assignPermissionToRole(adminRole._id, createEntityRecord._id);
      await assignPermissionToRole(adminRole._id, editEntityRecord._id);
      await assignPermissionToRole(adminRole._id, deleteEntityRecord._id);
    }
    
    // Assign permissions to moderator role
    if (moderatorRole) {
      await assignPermissionToRole(moderatorRole._id, viewUsers._id);
      await assignPermissionToRole(moderatorRole._id, createContent._id);
      await assignPermissionToRole(moderatorRole._id, editContent._id);
      await assignPermissionToRole(moderatorRole._id, deleteContent._id);
      
      // Moderators can view and edit entity types but not create or delete
      await assignPermissionToRole(moderatorRole._id, viewEntities._id);
      await assignPermissionToRole(moderatorRole._id, editEntity._id);
      
      // Moderators have full access to entity records except deletion
      await assignPermissionToRole(moderatorRole._id, viewEntityRecords._id);
      await assignPermissionToRole(moderatorRole._id, createEntityRecord._id);
      await assignPermissionToRole(moderatorRole._id, editEntityRecord._id);
    }
    
    // Assign permissions to user role
    if (userRole) {
      await assignPermissionToRole(userRole._id, createContent._id);
      await assignPermissionToRole(userRole._id, editContent._id); // Users can edit their own content
      
      // Regular users can only view entity types
      await assignPermissionToRole(userRole._id, viewEntities._id);
      
      // Regular users can view and create entity records but not edit or delete
      await assignPermissionToRole(userRole._id, viewEntityRecords._id);
      await assignPermissionToRole(userRole._id, createEntityRecord._id);
    }
    
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      const admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // This will be hashed by pre-save hook
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        emailVerified: true
      });
      
      // Assign admin role to admin user
      if (admin && adminRole) {
        await UserRole.create({
          userId: admin._id,
          roleId: adminRole._id
        });
        console.log('Admin user created and assigned admin role');
      }
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Seed data process completed');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Helper function to create a role if it doesn't exist
async function createRoleIfNotExists(name, description) {
  try {
    let role = await Role.findOne({ name });
    
    if (!role) {
      role = await Role.create({ name, description });
      console.log(`Role "${name}" created`);
    } else {
      console.log(`Role "${name}" already exists`);
    }
    
    return role;
  } catch (error) {
    console.error(`Error creating role ${name}:`, error);
    return null;
  }
}

// Helper function to create a permission if it doesn't exist
async function createPermissionIfNotExists(name, description) {
  try {
    let permission = await Permission.findOne({ name });
    
    if (!permission) {
      permission = await Permission.create({ name, description });
      console.log(`Permission "${name}" created`);
    } else {
      console.log(`Permission "${name}" already exists`);
    }
    
    return permission;
  } catch (error) {
    console.error(`Error creating permission ${name}:`, error);
    return null;
  }
}

// Helper function to assign a permission to a role if not already assigned
async function assignPermissionToRole(roleId, permissionId) {
  try {
    const exists = await RolePermission.findOne({ roleId, permissionId });
    
    if (!exists) {
      await RolePermission.create({ roleId, permissionId });
      console.log(`Permission assigned to role`);
    } else {
      console.log(`Permission already assigned to role`);
    }
  } catch (error) {
    console.error('Error assigning permission to role:', error);
  }
}

module.exports = seedData;