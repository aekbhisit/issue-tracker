# Authentication Guide

Authentication and authorization implementation for the Issue Collector Platform.

## Overview

The Issue Collector Platform uses JWT (JSON Web Tokens) for authentication. Admin endpoints require authentication, while public endpoints are generally open.

## Authentication Flow

### Login Flow

```
1. User submits credentials (username/password)
   ↓
2. API validates credentials
   ↓
3. API generates JWT token
   ↓
4. Token returned to client
   ↓
5. Client stores token (localStorage/cookie)
   ↓
6. Subsequent requests include token in Authorization header
```

## Admin API Authentication

### Login Endpoint

**POST** `/api/admin/v1/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Note**: Default credentials after database seeding:
- Username: `admin`
- Password: `admin`
- Email: `admin@admin.com`

⚠️ **Important**: Change the default password in production!

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": {
        "id": 1,
        "name": "Administrator"
      }
    }
  }
}
```

### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:4501/api/admin/v1/users
```

### Token Expiration

- **Default expiration**: 7 days
- **Configurable**: Set via `JWT_EXPIRES_IN` environment variable
- **Refresh**: Use refresh token endpoint (if implemented)

### Logout

**POST** `/api/admin/v1/auth/logout`

Logout invalidates the token (if token blacklisting is implemented) or relies on client-side token removal.

## Token Structure

### JWT Payload

```json
{
  "userId": 1,
  "username": "admin",
  "roleId": 1,
  "permissions": [
    "user.get_data",
    "user.add_data",
    "user.edit_data",
    "user.delete_data"
  ],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Claims

- `userId` - User ID
- `username` - Username
- `roleId` - Role ID
- `permissions` - Array of permission strings
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

## Authorization

### Role-Based Access Control (RBAC)

Users are assigned roles, and roles have permissions. Permissions are checked for each request.

### Permission Format

Permissions follow the pattern: `[module].[action].[type]`

- **module**: Feature module (e.g., `user`, `role`, `permission`)
- **action**: Action type (e.g., `get_data`, `add_data`, `edit_data`, `delete_data`)
- **type**: Scope (e.g., `admin`, `public`)

**Examples:**
- `user.get_data.admin` - View users in admin
- `user.add_data.admin` - Add users in admin
- `role.edit_data.admin` - Edit roles in admin

### Permission Checking

The API middleware checks permissions before allowing access:

```typescript
// Example middleware check
if (!hasPermission(user, 'user', 'get_data', 'admin')) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

## Error Responses

### Unauthorized (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Forbidden (403)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

## Frontend Implementation

### Storing Tokens

**Option 1: localStorage (Recommended)**
```typescript
// Store token
localStorage.setItem('token', token);

// Retrieve token
const token = localStorage.getItem('token');

// Remove token
localStorage.removeItem('token');
```

**Option 2: HTTP-only Cookies**
More secure but requires server-side cookie handling.

### Including Token in Requests

**Using Axios:**
```typescript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

**Using Fetch:**
```typescript
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Handling Token Expiration

```typescript
// Intercept 401 responses
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Token Expiration**: Set reasonable expiration times
3. **Secure Storage**: Use HTTP-only cookies when possible
4. **Token Rotation**: Implement token refresh mechanism
5. **Rate Limiting**: Limit login attempts
6. **Password Hashing**: Use bcrypt with appropriate rounds
7. **CORS**: Configure CORS properly
8. **Input Validation**: Validate all inputs

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:4502,http://localhost:4503
```

## Related Documentation

- [Admin API](./admin/) - Admin API endpoints
- [Public API](./public/) - Public API endpoints
- [API Design](../architecture/api-design.md) - API architecture

