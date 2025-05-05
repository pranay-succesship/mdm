# Entity Management API Documentation

This document provides comprehensive details about the entity management API endpoints for frontend implementation.

## Base URL

All API endpoints are relative to the base URL: `/api`

## Authentication Requirement

All entity endpoints require authentication using JWT token. Include the token in the request:
- As a Bearer token in the `Authorization` header: `Authorization: Bearer your_jwt_token`
- Or as an HTTP-only cookie (automatically included if logged in)

## Entity Endpoints

### List All Entities

Retrieves a paginated list of entities with optional filtering.

- **URL**: `/entities`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permission Required**: `view_entities`
- **Query Parameters**:
  - `search` (optional): Search term for name/description
  - `active` (optional): Filter by activation status (`true` or `false`)
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of results per page (default: 10)

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "count": 5,
  "totalPages": 3,
  "currentPage": 1,
  "total": 22,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "code": "PRODUCT",
      "name": "Product",
      "description": "Product entity type",
      "entityIsActive": true,
      "createdAt": "2023-04-28T15:30:45.123Z",
      "updatedAt": "2023-04-28T15:35:12.987Z",
      "createdBy": {
        "_id": "60d21b4667d0d8992e610c80",
        "username": "admin",
        "email": "admin@example.com"
      }
    },
    // More entities...
  ]
}
```

### Get Entity by ID

Retrieves detailed information about a specific entity.

- **URL**: `/entities/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permission Required**: `view_entities`
- **URL Parameters**:
  - `id`: MongoDB ID of the entity

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "code": "PRODUCT",
    "name": "Product",
    "description": "Product entity type",
    "entityIsActive": true,
    "derivedRecordConfig": {
      "activation": {
        "enabled": true,
        "defaultState": true,
        "useTimeBounding": false
      },
      "versioning": {
        "enabled": true
      },
      "hierarchy": {
        "enabled": false,
        "parentLinkField": "parentId",
        "linkType": "_id"
      }
    },
    "schemaDefinition": {
      "type": "object",
      "properties": {
        "productName": {
          "type": "string",
          "minLength": 2,
          "maxLength": 100
        },
        "productCode": {
          "type": "string",
          "pattern": "^[A-Z0-9]{6,10}$"
        },
        "price": {
          "type": "number",
          "minimum": 0
        }
      },
      "required": ["productName", "productCode"]
    },
    "createdAt": "2023-04-28T15:30:45.123Z",
    "updatedAt": "2023-04-28T15:35:12.987Z",
    "createdBy": {
      "_id": "60d21b4667d0d8992e610c80",
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

### Get Entity by Code

Retrieves detailed information about a specific entity using its code.

- **URL**: `/entities/code/:code`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permission Required**: `view_entities`
- **URL Parameters**:
  - `code`: The unique code of the entity (case-insensitive, will be converted to uppercase)

- **Success Response**: Same as Get Entity by ID

### Get Entity Schema Definition

Retrieves just the schema definition for a specific entity.

- **URL**: `/entities/:id/schema`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permission Required**: `view_entities`
- **URL Parameters**:
  - `id`: MongoDB ID of the entity

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "data": {
    "entityCode": "PRODUCT",
    "entityName": "Product",
    "schemaDefinition": {
      "type": "object",
      "properties": {
        "productName": {
          "type": "string",
          "minLength": 2,
          "maxLength": 100
        },
        "productCode": {
          "type": "string",
          "pattern": "^[A-Z0-9]{6,10}$"
        },
        "price": {
          "type": "number",
          "minimum": 0
        }
      },
      "required": ["productName", "productCode"]
    },
    "derivedRecordConfig": {
      "activation": {
        "enabled": true,
        "defaultState": true,
        "useTimeBounding": false
      },
      "versioning": {
        "enabled": true
      },
      "hierarchy": {
        "enabled": false,
        "parentLinkField": "parentId",
        "linkType": "_id"
      }
    }
  }
}
```

### Create New Entity

Creates a new entity type definition.

- **URL**: `/entities`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permission Required**: `create_entity`
- **Request Body**:

```json
{
  "code": "CUSTOMER",
  "name": "Customer",
  "description": "Customer master data entity",
  "entityIsActive": true,
  "derivedRecordConfig": {
    "activation": {
      "enabled": true,
      "defaultState": true,
      "useTimeBounding": false
    },
    "versioning": {
      "enabled": false
    },
    "hierarchy": {
      "enabled": false
    }
  },
  "schemaDefinition": {
    "type": "object",
    "properties": {
      "customerName": {
        "type": "string",
        "minLength": 2
      },
      "customerCode": {
        "type": "string",
        "pattern": "^[A-Z0-9]{5,10}$"
      },
      "email": {
        "type": "string",
        "format": "email"
      },
      "phoneNumber": {
        "type": "string"
      },
      "isVip": {
        "type": "boolean",
        "default": false
      }
    },
    "required": ["customerName", "customerCode", "email"]
  }
}
```

- **Success Response**:
  - **Code**: 201 Created
  - **Content**: Complete entity object including generated ID and timestamps

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Entity with the same code already exists
    - Validation errors in the schema
  - **Code**: 401 Unauthorized
    - Not authenticated
  - **Code**: 403 Forbidden
    - Missing required permission
  - **Code**: 500 Server Error

### Update Entity

Updates an existing entity type definition.

- **URL**: `/entities/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permission Required**: `edit_entity`
- **URL Parameters**:
  - `id`: MongoDB ID of the entity
- **Request Body**: Same structure as Create Entity, but the `code` field will be ignored (it's immutable)

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Updated entity object

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Validation errors
    - Attempting to modify immutable fields
  - **Code**: 404 Not Found
    - Entity not found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

### Toggle Entity Activation

Activates or deactivates an entity type.

- **URL**: `/entities/:id/toggle-activation`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Permission Required**: `edit_entity`
- **URL Parameters**:
  - `id`: MongoDB ID of the entity

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "code": "CUSTOMER",
    "entityIsActive": false
  }
}
```

- **Error Responses**:
  - **Code**: 404 Not Found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

### Delete Entity

Deletes an entity type definition.

- **URL**: `/entities/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Role Required**: `admin` (only administrators can delete entities)
- **URL Parameters**:
  - `id`: MongoDB ID of the entity

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "status": "success",
  "message": "Entity deleted successfully"
}
```

- **Error Responses**:
  - **Code**: 404 Not Found
  - **Code**: 401 Unauthorized
  - **Code**: 403 Forbidden
  - **Code**: 500 Server Error

## Schema Definition Format

The `schemaDefinition` object uses a subset of JSON Schema to define the structure of derived records:

### Property Types

- `string`: Text values
- `number`: Numeric values
- `boolean`: True/False values
- `integer`: Whole number values
- `array`: Lists of items
- `object`: Nested structures

### Common Validations

- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `pattern`: Regex pattern for strings
- `format`: Special formats like "email", "date-time"
- `minimum`: Minimum value for numbers
- `maximum`: Maximum value for numbers
- `enum`: List of allowed values
- `default`: Default value if none provided

### Example Schema Definition

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 120
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive", "pending"]
    }
  },
  "required": ["name", "email"]
}
```

## Derived Record Configuration

The `derivedRecordConfig` object controls how records derived from this entity type behave:

### Activation

- `enabled`: If true, records have an 'isActive' field
- `defaultState`: Default value for 'isActive' on new records
- `useTimeBounding`: If true, records have 'effectiveFrom' and 'effectiveTo' fields

### Versioning

- `enabled`: If true, enables record versioning with 'version', 'isCurrent', and 'expiredAt' fields

### Hierarchy

- `enabled`: If true, enables parent-child relationships
- `parentLinkField`: Field name to store the parent reference
- `linkType`: How to reference the parent ('_id' or 'code')