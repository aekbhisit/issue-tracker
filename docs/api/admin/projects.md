# Projects API Documentation

Admin API endpoints for project management (IC-1: Project Registration System).

## Base URL

```
/api/admin/v1/projects
```

## Authentication

All endpoints require JWT authentication and admin permissions. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Permissions

All endpoints require the following permissions:

- `project.view.get_data` - View project list
- `project.view.get_detail` - View project details
- `project.add.add_data` - Create project
- `project.edit.edit_data` - Update project
- `project.delete.delete_data` - Delete project

## Endpoints

### List Projects

Get a paginated list of projects with optional filtering and sorting.

**Endpoint:** `GET /projects`

**Query Parameters:**

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `search` (optional) - Search query (searches name and description)
- `status` (optional) - Filter by status (`true` or `false`)
- `sortBy` (optional) - Field to sort by (`name`, `status`, `createdAt`, `updatedAt`)
- `sortOrder` (optional) - Sort order (`asc` or `desc`, default: `desc`)

**Example Request:**

```bash
GET /api/admin/v1/projects?page=1&limit=20&search=myapp&status=true&sortBy=createdAt&sortOrder=desc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "My Application",
        "description": "Main application project",
        "publicKey": "proj_pub_abc123...",
        "privateKey": "proj_priv_xyz789...",
        "status": true,
        "allowedDomains": ["app.example.com", "*.example.com"],
        "environments": [
          {
            "id": 1,
            "projectId": 1,
            "name": "prod",
            "apiUrl": "https://api.example.com",
            "allowedOrigins": ["https://app.example.com"],
            "isActive": true,
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "deletedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

### Get Project by ID

Get a single project by its ID.

**Endpoint:** `GET /projects/:id`

**Path Parameters:**

- `id` - Project ID (integer)

**Example Request:**

```bash
GET /api/admin/v1/projects/1
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My Application",
    "description": "Main application project",
    "publicKey": "proj_pub_abc123...",
    "privateKey": "proj_priv_xyz789...",
    "status": true,
    "allowedDomains": ["app.example.com", "*.example.com"],
    "environments": [
      {
        "id": 1,
        "projectId": 1,
        "name": "prod",
        "apiUrl": "https://api.example.com",
        "allowedOrigins": ["https://app.example.com"],
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

### Create Project

Create a new project. Public and private keys are automatically generated.

**Endpoint:** `POST /projects`

**Request Body:**

```json
{
  "name": "My Application",
  "description": "Main application project",
  "allowedDomains": ["app.example.com", "*.example.com"],
  "status": true,
  "environments": [
    {
      "name": "prod",
      "apiUrl": "https://api.example.com",
      "allowedOrigins": ["https://app.example.com"],
      "isActive": true
    }
  ]
}
```

**Field Descriptions:**

- `name` (required) - Project name (max 255 characters)
- `description` (optional) - Project description (max 1000 characters)
- `allowedDomains` (required) - Array of allowed domains (min 1)
  - Supports exact domains: `app.example.com`
  - Supports wildcards: `*.example.com`
- `status` (optional) - Project status (default: `true`)
- `environments` (optional) - Array of environment configurations
  - `name` (required) - Environment name (`dev`, `staging`, `prod`, `test`, `development`, `production`)
  - `apiUrl` (optional) - API URL for this environment
  - `allowedOrigins` (optional) - Array of allowed origins
  - `isActive` (optional) - Environment active status (default: `true`)

**Example Request:**

```bash
POST /api/admin/v1/projects
Content-Type: application/json

{
  "name": "My Application",
  "description": "Main application project",
  "allowedDomains": ["app.example.com"],
  "status": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 1,
    "name": "My Application",
    "description": "Main application project",
    "publicKey": "proj_pub_abc123...",
    "privateKey": "proj_priv_xyz789...",
    "status": true,
    "allowedDomains": ["app.example.com"],
    "environments": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

### Update Project

Update an existing project. All fields are optional.

**Endpoint:** `PATCH /projects/:id`

**Path Parameters:**

- `id` - Project ID (integer)

**Request Body:**

```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "allowedDomains": ["new.example.com"],
  "status": false
}
```

**Example Request:**

```bash
PATCH /api/admin/v1/projects/1
Content-Type: application/json

{
  "name": "Updated Project Name",
  "status": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Project Name",
    "description": "Main application project",
    "publicKey": "proj_pub_abc123...",
    "privateKey": "proj_priv_xyz789...",
    "status": false,
    "allowedDomains": ["app.example.com"],
    "environments": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "deletedAt": null
  }
}
```

### Delete Project

Soft delete a project (sets `deletedAt` timestamp).

**Endpoint:** `DELETE /projects/:id`

**Path Parameters:**

- `id` - Project ID (integer)

**Example Request:**

```bash
DELETE /api/admin/v1/projects/1
```

**Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": null
}
```

## Environment Management

### Add Environment

Add an environment to a project.

**Endpoint:** `POST /projects/:id/environments`

**Path Parameters:**

- `id` - Project ID (integer)

**Request Body:**

```json
{
  "name": "prod",
  "apiUrl": "https://api.example.com",
  "allowedOrigins": ["https://app.example.com"],
  "isActive": true
}
```

**Example Request:**

```bash
POST /api/admin/v1/projects/1/environments
Content-Type: application/json

{
  "name": "prod",
  "apiUrl": "https://api.example.com",
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Environment added successfully",
  "data": {
    "id": 1,
    "projectId": 1,
    "name": "prod",
    "apiUrl": "https://api.example.com",
    "allowedOrigins": ["https://app.example.com"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Environment

Update an existing environment.

**Endpoint:** `PATCH /projects/:id/environments/:envId`

**Path Parameters:**

- `id` - Project ID (integer)
- `envId` - Environment ID (integer)

**Request Body:**

```json
{
  "name": "production",
  "apiUrl": "https://api-v2.example.com",
  "isActive": false
}
```

**Example Request:**

```bash
PATCH /api/admin/v1/projects/1/environments/1
Content-Type: application/json

{
  "isActive": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Environment updated successfully",
  "data": {
    "id": 1,
    "projectId": 1,
    "name": "prod",
    "apiUrl": "https://api.example.com",
    "allowedOrigins": ["https://app.example.com"],
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### Remove Environment

Remove an environment from a project.

**Endpoint:** `DELETE /projects/:id/environments/:envId`

**Path Parameters:**

- `id` - Project ID (integer)
- `envId` - Environment ID (integer)

**Example Request:**

```bash
DELETE /api/admin/v1/projects/1/environments/1
```

**Response:**

```json
{
  "success": true,
  "message": "Environment removed successfully",
  "data": null
}
```

## Domain Validation

### Supported Formats

1. **Exact Domain**: `app.example.com`
   - Matches exactly `app.example.com`
   - Does not match subdomains unless explicitly configured

2. **Wildcard Domain**: `*.example.com`
   - Matches any subdomain of `example.com`
   - Examples: `app.example.com`, `api.example.com`, `staging.example.com`
   - Does not match `example.com` itself

### Validation Rules

- Domains must be valid domain names
- Wildcard domains must have a domain part after `*.`
- Each domain must be unique within the project
- At least one domain is required when creating a project

## Key Generation

When a project is created, two keys are automatically generated:

- **Public Key**: `proj_pub_<32 hex characters>`
  - Used for public API access
  - Can be exposed in client-side code

- **Private Key**: `proj_priv_<32 hex characters>`
  - Used for server-side API access
  - Must be kept secret

Both keys are cryptographically secure random strings and are unique across all projects.

## Error Responses

### Validation Error (422)

```json
{
  "error": "ValidationError",
  "message": "Validation failed",
  "status": 422,
  "details": [
    {
      "msg": "Name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### Not Found (404)

```json
{
  "error": "NotFoundError",
  "message": "Project not found",
  "status": 404
}
```

### Conflict (409)

```json
{
  "error": "ConflictError",
  "message": "Project with this name already exists.",
  "status": 409
}
```

### Unauthorized (401)

```json
{
  "error": "UnauthorizedError",
  "message": "Invalid or missing authentication token",
  "status": 401
}
```

### Forbidden (403)

```json
{
  "error": "ForbiddenError",
  "message": "Insufficient permissions",
  "status": 403
}
```

## Related Documentation

- [Admin API Overview](./README.md)
- [Database Design](../../architecture/database-design.md)
- [Authentication](../authentication.md)

