# Authentication API Documentation

This document provides comprehensive details about the authentication API endpoints for frontend implementation.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication Endpoints

### Register a New User

Creates a new user account and assigns the default "user" role.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:

```json
{
  "username": "johndoe",
  "email": "johndoe@example.com",
  "password": "password123",
  "firstName": "John", 
  "lastName": "Doe"
}
```

- **Success Response**:
  - **Code**: 201 Created
  - **Content**:

```json
{
  "status": "success",
  "token": "jwt_token_here",
  "data": {
    "_id": "user_id_here",
    "username": "johndoe",
    "email": "johndoe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "emailVerified": false
  }
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - User already exists
    - Validation errors
  - **Code**: 500 Server Error

### User Login

Authenticates a user and returns a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:

```json
{
  "email": "johndoe@example.com",
  "password": "password123"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "token": "jwt_token_here",
  "data": {
    "_id": "user_id_here",
    "username": "johndoe",
    "email": "johndoe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "emailVerified": false
  }
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - Invalid credentials
    - Account deactivated
  - **Code**: 400 Bad Request
    - Validation errors
  - **Code**: 500 Server Error

### User Logout

Logs out the current user by clearing the authentication token.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (JWT Token)
- **Headers**:
  - `Authorization: Bearer your_jwt_token`

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### Get Current User

Retrieves the profile of the currently authenticated user.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes (JWT Token)
- **Headers**:
  - `Authorization: Bearer your_jwt_token`

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "data": {
    "_id": "user_id_here",
    "username": "johndoe",
    "email": "johndoe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"],
    "isActive": true,
    "emailVerified": false,
    "lastLogin": "2023-05-02T12:00:00.000Z"
  }
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - Not authenticated
  - **Code**: 500 Server Error

### Update Password

Updates the password for the currently authenticated user.

- **URL**: `/auth/update-password`
- **Method**: `PUT`
- **Auth Required**: Yes (JWT Token)
- **Headers**:
  - `Authorization: Bearer your_jwt_token`
- **Request Body**:

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "message": "Password updated successfully",
  "token": "new_jwt_token_here"
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - Current password is incorrect
  - **Code**: 400 Bad Request
    - Validation errors
  - **Code**: 500 Server Error

## Role Management Endpoints

### Get All Roles

Retrieves all roles in the system.

- **URL**: `/roles`
- **Method**: `GET`
- **Auth Required**: Yes (JWT Token with admin role)
- **Headers**:
  - `Authorization: Bearer your_jwt_token`

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "_id": "role_id_here",
      "name": "admin",
      "description": "Administrator with full system access"
    },
    {
      "_id": "role_id_here",
      "name": "user",
      "description": "Regular user with limited access"
    },
    {
      "_id": "role_id_here",
      "name": "moderator",
      "description": "Moderator with content management permissions"
    }
  ]
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - Not authenticated
  - **Code**: 403 Forbidden
    - Not authorized (not an admin)
  - **Code**: 500 Server Error

### Get Users with Specific Role

Retrieves all users that have a specific role.

- **URL**: `/roles/:roleId/users`
- **Method**: `GET`
- **Auth Required**: Yes (JWT Token with admin role)
- **Headers**:
  - `Authorization: Bearer your_jwt_token`
- **URL Parameters**:
  - `roleId`: MongoDB ID of the role

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "_id": "user_id_here",
      "username": "johndoe",
      "email": "johndoe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true
    },
    {
      "_id": "another_user_id",
      "username": "janedoe",
      "email": "janedoe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "isActive": true
    }
  ]
}
```

- **Error Responses**:
  - **Code**: 404 Not Found
    - Role not found
  - **Code**: 401 Unauthorized
    - Not authenticated
  - **Code**: 403 Forbidden
    - Not authorized (not an admin)
  - **Code**: 500 Server Error

## User Role Management Endpoints

### Get User Roles

Retrieves all roles assigned to a specific user.

- **URL**: `/users/:userId/roles`
- **Method**: `GET`
- **Auth Required**: Yes (JWT Token with admin role)
- **Headers**:
  - `Authorization: Bearer your_jwt_token`
- **URL Parameters**:
  - `userId`: MongoDB ID of the user

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "_id": "role_id_here",
      "name": "user",
      "description": "Regular user with limited access"
    },
    {
      "_id": "role_id_here",
      "name": "moderator",
      "description": "Moderator with content management permissions"
    }
  ]
}
```

- **Error Responses**:
  - **Code**: 404 Not Found
    - User not found
  - **Code**: 401 Unauthorized
    - Not authenticated
  - **Code**: 403 Forbidden
    - Not authorized (not an admin)
  - **Code**: 500 Server Error

### Add Role to User

Assigns a role to a specific user.

- **URL**: `/users/:userId/roles`
- **Method**: `POST`
- **Auth Required**: Yes (JWT Token with admin role)
- **Headers**:
  - `Authorization: Bearer your_jwt_token`
- **URL Parameters**:
  - `userId`: MongoDB ID of the user
- **Request Body**:

```json
{
  "roleId": "role_id_here"
}
```

- **Success Response**:
  - **Code**: 201 Created
  - **Content**:

```json
{
  "status": "success",
  "data": {
    "userId": "user_id_here",
    "roleId": "role_id_here",
    "username": "johndoe",
    "roleName": "moderator"
  }
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Role is already assigned to this user
    - Validation errors
  - **Code**: 404 Not Found
    - User not found
    - Role not found
  - **Code**: 401 Unauthorized
    - Not authenticated
  - **Code**: 403 Forbidden
    - Not authorized (not an admin)
  - **Code**: 500 Server Error

## Authentication and Authorization Mechanism

### JWT Token Format

The authentication system uses JSON Web Tokens (JWT) for authentication. The token is sent in:

1. The `Authorization` header as `Bearer {token}`
2. As an HTTP-only cookie named `token`

### Token Lifespan

By default, tokens are valid for 30 days from issuance.

### RBAC (Role-Based Access Control)

Access to certain endpoints is restricted based on user roles. The system uses middleware to enforce these restrictions:

1. `protect`: Ensures the user is authenticated
2. `authorize`: Ensures the user has one of the required roles
3. `hasPermission`: Ensures the user has specific permissions

## Integration Tips for Frontend

1. **Storing the Token**:
   - Store the JWT token in an HTTP-only cookie (automatically done by the API)
   - For SPA applications, you may also store it in localStorage or sessionStorage, but be aware of XSS risks

2. **Sending the Token**:
   - Include the token in the `Authorization` header as `Bearer {token}` for all protected routes

3. **Handling Expiry**:
   - When a token expires (401 response), redirect the user to the login page
   - Consider implementing a token refresh mechanism for a seamless experience

4. **Role-Based UI**:
   - Use the user roles returned from the `/auth/me` endpoint to conditionally render UI elements

5. **Error Handling**:
   - Implement consistent error handling for different status codes (400, 401, 403, 404, 500)

## Default Admin Account

For initial setup and testing, the system is seeded with a default admin account:

- Email: `admin@example.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change this password immediately in a production environment.