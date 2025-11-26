# Public API Documentation

Public-facing API endpoints for the Issue Collector Platform.

## Base URL

```
/api/public/v1
```

## Authentication

Most public endpoints do not require authentication. Some endpoints may require API keys for rate limiting.

## Endpoints

### Health Check

- `GET /health` - API health status

### Issue Collection

- `POST /issues` - Submit a new issue
- `GET /issues/:id` - Get issue by ID (if public)
- `GET /issues` - List public issues (if enabled)

## Rate Limiting

Public API is rate-limited to 60 requests per minute per IP address.

## Response Format

See [API Documentation](../README.md#response-format) for standard response format.

## Related Documentation

- [Admin API](../admin/) - Admin API endpoints
- [Authentication](../authentication.md) - Authentication guide

