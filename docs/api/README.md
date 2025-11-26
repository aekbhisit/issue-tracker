# API Documentation

API documentation for the Issue Collector Platform.

## Structure

- **[Admin API](./admin/)** - Admin dashboard API endpoints
- **[Public API](./public/)** - Public-facing API endpoints
- **[Authentication](./authentication.md)** - Authentication and authorization

## Base URLs

- **Development**: `http://localhost:4501`
- **Production**: `https://api.yourdomain.com`

## API Versions

All APIs are versioned:
- Admin API: `/api/admin/v1`
- Public API: `/api/public/v1`

## Authentication

Most admin endpoints require JWT authentication. See [Authentication Guide](./authentication.md) for details.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Rate Limiting

API requests are rate-limited:
- **Admin API**: 100 requests per minute per IP
- **Public API**: 60 requests per minute per IP

## Related Documentation

- [API Design](../architecture/api-design.md) - API architecture and design principles
- [Authentication](./authentication.md) - Authentication implementation

