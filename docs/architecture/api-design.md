# API Design

API architecture and design principles for the Issue Collector Platform.

## API Structure

### Base URLs

- **Admin API**: `/api/admin/v1`
- **Public API**: `/api/public/v1`

### Versioning

APIs are versioned using URL path versioning:
- Current version: `v1`
- Future versions: `v2`, `v3`, etc.

## Design Principles

### RESTful Design

- Use HTTP methods appropriately:
  - `GET` - Retrieve resources
  - `POST` - Create resources
  - `PUT` - Update entire resource
  - `PATCH` - Partial update
  - `DELETE` - Delete resources

### Resource Naming

- Use plural nouns: `/users`, `/roles`, `/permissions`
- Use kebab-case for multi-word resources: `/activity-logs`
- Avoid verbs in URLs

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Resource data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

## Authentication

### JWT Authentication

All admin endpoints require JWT authentication:

```
Authorization: Bearer <token>
```

### Token Structure

```json
{
  "userId": 1,
  "username": "admin",
  "roleId": 1,
  "permissions": ["user.get_data", "user.add_data"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Request/Response Patterns

### Pagination

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Filtering

**Query Parameters:**
- `search` - Full-text search
- `status` - Boolean filter
- `roleId` - Foreign key filter
- `createdAt` - Date range filter

**Example:**
```
GET /api/admin/v1/users?search=john&status=true&roleId=2
```

### Sorting

**Query Parameters:**
- `sortBy` - Field name
- `sortOrder` - `asc` or `desc`

**Example:**
```
GET /api/admin/v1/users?sortBy=createdAt&sortOrder=desc
```

### Field Selection

**Query Parameters:**
- `fields` - Comma-separated field names

**Example:**
```
GET /api/admin/v1/users?fields=id,name,email
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Resource already exists
- `INTERNAL_ERROR` - Server error

## Rate Limiting

- **Admin API**: 100 requests/minute per IP
- **Public API**: 60 requests/minute per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## API Modules

### Module Structure

```
modules/[feature]/
├── [feature].controller.ts  # Request handling
├── [feature].service.ts     # Business logic
├── [feature].validation.ts  # Input validation
├── [feature].types.ts       # TypeScript types
└── routes/
    ├── public.routes.ts     # Public routes
    └── admin.routes.ts     # Admin routes
```

### Controller Pattern

```typescript
export class UserController {
  async getUsers(req: Request, res: Response) {
    // 1. Validate query parameters
    // 2. Call service
    // 3. Return response
  }
}
```

### Service Pattern

```typescript
export class UserService {
  async getUsers(params: GetUsersParams) {
    // 1. Build query
    // 2. Execute database query
    // 3. Transform data
    // 4. Return result
  }
}
```

## Related Documentation

- [Admin API](../api/admin/) - Admin API endpoints
- [Public API](../api/public/) - Public API endpoints
- [Authentication](../api/authentication.md) - Authentication guide

