# Entity Records API Documentation

This document provides comprehensive details about the entity records API endpoints for frontend implementation. Entity records are the actual data instances created from entity type definitions.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication Requirement

All entity record endpoints require authentication using JWT token. Include the token in the request:
- As a Bearer token in the `Authorization` header: `Authorization: Bearer your_jwt_token`
- Or as an HTTP-only cookie (automatically included if logged in)

## Entity Record Endpoints

### List Records for an Entity Type

Retrieves a paginated list of records for a specific entity type.

- **URL**: `/entity-records/:entityCode`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permission Required**: `view_entity_records`
- **URL Parameters**:
  - `entityCode`: The unique code of the entity type (e.g., "PRODUCT", "CUSTOMER")
- **Query Parameters**:
  - `search` (optional): Search term for data fields
  - `currentOnly` (optional): Only show current versions if versioning is enabled (default: `true`)
  - `active` (optional): Filter by activation status (`true` or `false`)
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of results per page (default: 20)

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "count": 3,
  "totalPages": 2,
  "currentPage": 1,
  "total": 25,
  "entityName": "Customer",
  "data": [
    {
      "_id": "60f7a4c67d0d8992e610c85",
      "entityId": "60d21b4667d0d8992e610c85",
      "entityCode": "CUSTOMER",
      "data": {
        "customerName": "Acme Corp",
        "customerCode": "ACME001",
        "email": "contact@acme.com",
        "phoneNumber": "555-1234",
        "isVip": true
      },
      "isActive": true,
      "version": 1,
      "isCurrent": true,
      "createdAt": "2023-05-10T15:30:45.123Z",
      "updatedAt": "2023-05-10T15:30:45.123Z",
      "createdBy": {
        "_id": "60d21b4667d0d8992e610c80",
        "username": "admin",
        "email": "admin@example.com"
      },
      "updatedBy": {
        "_id": "60d21b4667d0d8992e610c80",
        "username": "admin",
        "email": "admin@example.com"
      }
    },
    // More records...
  ]
}
```

- **Error Responses**:
  - **Code**: 404 Not Found - Entity type not found
  - **Code**: 401 Unauthorized - Not authenticated
  - **Code**: 403 Forbidden - Missing required permission
  - **Code**: 500 Server Error

### Get Record by ID

Retrieves a single entity record by its ID.

- **URL**: `/entity-records/:entityCode/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permission Required**: `view_entity_records`
- **URL Parameters**:
  - `entityCode`: The unique code of the entity type
  - `id`: MongoDB ID of the record

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "entityName": "Customer",
  "data": {
    "_id": "60f7a4c67d0d8992e610c85",
    "entityId": "60d21b4667d0d8992e610c85",
    "entityCode": "CUSTOMER",
    "data": {
      "customerName": "Acme Corp",
      "customerCode": "ACME001",
      "email": "contact@acme.com",
      "phoneNumber": "555-1234",
      "isVip": true
    },
    "isActive": true,
    "version": 1,
    "isCurrent": true,
    "createdAt": "2023-05-10T15:30:45.123Z",
    "updatedAt": "2023-05-10T15:30:45.123Z",
    "createdBy": {
      "_id": "60d21b4667d0d8992e610c80",
      "username": "admin",
      "email": "admin@example.com"
    },
    "updatedBy": {
      "_id": "60d21b4667d0d8992e610c80",
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

- **Error Responses**:
  - **Code**: 404 Not Found - Record not found
  - **Code**: 400 Bad Request - Invalid ID format
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

### Create New Record

Creates a new entity record.

- **URL**: `/entity-records/:entityCode`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permission Required**: `create_entity_record`
- **URL Parameters**:
  - `entityCode`: The unique code of the entity type
- **Request Body**:

```json
{
  "data": {
    "customerName": "Acme Corp",
    "customerCode": "ACME001",
    "email": "contact@acme.com",
    "phoneNumber": "555-1234",
    "isVip": true
  },
  "isActive": true,
  "effectiveFrom": "2023-05-10T00:00:00.000Z",
  "effectiveTo": null,
  "parent": "60f7a4c67d0d8992e610c83"  // Optional, only if hierarchy is enabled
}
```

- **Success Response**:
  - **Code**: 201 Created
  - **Content**: The created record with metadata

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Entity is inactive
    - Validation errors in data
  - **Code**: 404 Not Found - Entity type not found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

### Update Record

Updates an existing entity record.

- **URL**: `/entity-records/:entityCode/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permission Required**: `edit_entity_record`
- **URL Parameters**:
  - `entityCode`: The unique code of the entity type
  - `id`: MongoDB ID of the record
- **Request Body**: Same structure as Create Record

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: The updated record with metadata

- **Error Responses**:
  - **Code**: 400 Bad Request - Validation errors
  - **Code**: 404 Not Found - Record not found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

### Toggle Record Activation

Activates or deactivates an entity record.

- **URL**: `/entity-records/:entityCode/:id/toggle-activation`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Permission Required**: `edit_entity_record`
- **URL Parameters**:
  - `entityCode`: The unique code of the entity type
  - `id`: MongoDB ID of the record

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "entityName": "Customer",
  "data": {
    "id": "60f7a4c67d0d8992e610c85",
    "isActive": false
  }
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request - Activation not enabled for this entity type
  - **Code**: 404 Not Found - Record not found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

### Delete Record

Deletes an entity record.

- **URL**: `/entity-records/:entityCode/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permission Required**: `delete_entity_record`
- **URL Parameters**:
  - `entityCode`: The unique code of the entity type
  - `id`: MongoDB ID of the record

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "message": "Entity record deleted successfully",
  "entityName": "Customer"
}
```

- **Error Responses**:
  - **Code**: 404 Not Found - Record not found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

### Get Record Versions

Retrieves all versions of a specific entity record.

- **URL**: `/entity-records/:entityCode/:id/versions`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permission Required**: `view_entity_records`
- **URL Parameters**:
  - `entityCode`: The unique code of the entity type
  - `id`: MongoDB ID of the record

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "entityName": "Customer",
  "count": 3,
  "data": [
    {
      "_id": "60f7a4c67d0d8992e610c85",
      "entityCode": "CUSTOMER",
      "data": {
        "customerName": "Acme Corp",
        "customerCode": "ACME001",
        "email": "contact@acme.com",
        "phoneNumber": "555-1234",
        "isVip": true
      },
      "version": 3,
      "isCurrent": true,
      "createdAt": "2023-05-10T15:30:45.123Z",
      "updatedAt": "2023-05-12T14:22:33.987Z",
      // Other record data...
    },
    {
      "_id": "60f7a4c67d0d8992e610c86",
      "entityCode": "CUSTOMER",
      "data": {
        "customerName": "Acme Corp",
        "customerCode": "ACME001",
        "email": "contact@acme.com",
        "phoneNumber": "555-5678",
        "isVip": false
      },
      "version": 2,
      "isCurrent": false,
      "expiredAt": "2023-05-12T14:22:33.987Z",
      // Other record data...
    },
    // More versions...
  ]
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Versioning not enabled for this entity type
    - Cannot determine business key for versioning
  - **Code**: 404 Not Found - Record not found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

## Special Features

### Versioning

If an entity type has versioning enabled:

- Each update creates a new version of the record
- Previous versions are marked as `isCurrent: false`
- The latest version is marked as `isCurrent: true`
- Previous versions have an `expiredAt` timestamp
- The version number increments with each update

### Time Bounding

If time bounding is enabled for an entity type:

- Records can have `effectiveFrom` and `effectiveTo` dates
- Allows for planning future changes and tracking historical validity periods
- `effectiveTo: null` indicates no end date (indefinite validity)

### Hierarchy

If hierarchy is enabled for an entity type:

- Records can have parent-child relationships
- The parent reference field name is configurable (`parentLinkField`)
- Parent can be referenced by its ID or by a business code, depending on the entity config