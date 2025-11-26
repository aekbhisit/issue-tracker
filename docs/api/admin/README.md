# Admin API Documentation

Admin dashboard API endpoints for the Issue Collector Platform.

## Base URL

```
/api/admin/v1
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

- `POST /auth/login` - Admin login
- `POST /auth/logout` - Admin logout
- `POST /auth/refresh` - Refresh access token

### Users

- `GET /users` - List users (with pagination, filters, sorting)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `PATCH /users/:id/status` - Toggle user status
- `PATCH /users/:id/role` - Update user role

### Roles

- `GET /roles` - List roles
- `GET /roles/:id` - Get role by ID
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

### Permissions

- `GET /permissions` - List permissions
- `GET /permissions/:id` - Get permission by ID

### Activity Logs

- `GET /activity-logs` - List activity logs (with filters)

### Projects (IC-1)

- `GET /projects` - List projects (with pagination, filters, sorting)
- `GET /projects/:id` - Get project by ID
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project (soft delete)
- `POST /projects/:id/environments` - Add environment to project
- `PATCH /projects/:id/environments/:envId` - Update project environment
- `DELETE /projects/:id/environments/:envId` - Remove environment from project

See [Projects API Documentation](./projects.md) for detailed documentation.

## Query Parameters

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Filtering

- `search` - Search query (searches across multiple fields)
- `status` - Filter by status (true/false)
- `roleId` - Filter by role ID

### Sorting

- `sortBy` - Field to sort by
- `sortOrder` - Sort order (`asc` or `desc`)

### Example Request

```bash
GET /api/admin/v1/users?page=1&limit=20&search=john&status=true&sortBy=createdAt&sortOrder=desc
```

## Response Format

See [API Documentation](../README.md#response-format) for standard response format.

## Error Codes

- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `422` - Validation error
- `500` - Internal server error

## Related Documentation

- [Public API](../public/) - Public API endpoints
- [Authentication](../authentication.md) - Authentication guide

