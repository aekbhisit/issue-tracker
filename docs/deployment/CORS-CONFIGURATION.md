# CORS Configuration Guide

## Problem: CORS Error 403

If you're seeing this error:
```json
{
  "error": "CorsError",
  "message": "Request blocked by CORS policy. Please check server CORS configuration.",
  "status": 403,
  "details": {
    "code": "CORS_POLICY_VIOLATION",
    "hint": "The request origin is not allowed by the server CORS policy. Check CORS_ORIGIN or ALLOWED_ORIGINS environment variable."
  }
}
```

This means the API is blocking requests from your frontend/admin origin because it's not in the allowed origins list.

## Solution

### Step 1: Update CORS_ORIGIN in stack.env

Edit `infra/stack.env` and update the `CORS_ORIGIN` variable:

```env
# Production domain
CORS_ORIGIN=https://issue.haahii.com,http://localhost:3412,http://localhost:3411
```

**Important Notes:**
- Include **both** the protocol (`https://` or `http://`) and domain
- **Do NOT** include paths (e.g., `/admin`) - CORS origin is just protocol + domain + port
- Separate multiple origins with commas (no spaces)
- The origin from browser requests is just the domain (e.g., `https://issue.haahii.com`), not the full URL

### Step 2: Deploy Updated Configuration

#### Option A: Using Portainer (Recommended)

**⚠️ IMPORTANT: Portainer cannot upload files directly**

Since Portainer doesn't support file uploads, you **MUST** paste environment variables manually:

**Steps:**
1. **Update `infra/stack.env`** with your `CORS_ORIGIN` value:
   ```env
   CORS_ORIGIN=https://issue.haahii.com,http://localhost:3412,http://localhost:3411
   ```

2. **In Portainer:**
   - Go to **Stacks** → Your stack → **Editor**
   - Scroll to **Environment Variables** section
   - **Copy ALL variables from `stack.env`** (or at least update `CORS_ORIGIN`)
   - **Paste** into Portainer's "Environment Variables" section
   - Format: Each line should be `KEY=VALUE` (Portainer will ignore comment lines starting with `#`)
   - Click **Update the stack**

3. **Restart the API container:**
   - Go to **Containers** → `issue-collector-api` → **Restart**

**Note:** The `env_file` directive in docker-compose.prod.yml is commented out because:
- Portainer cannot upload files to Docker host
- `env_file` requires the file to exist on the Docker host filesystem
- Manual pasting in Portainer's Environment Variables section is the standard approach

#### Option B: Using Docker Compose CLI

If deploying via `docker-compose` CLI:

```bash
cd /path/to/issue-tracker/infra/docker
docker-compose -f docker-compose.prod.yml up -d --force-recreate api
```

The `env_file: ../stack.env` in docker-compose.prod.yml will automatically load variables.

### Step 3: Verify Configuration

Check the API container logs to verify CORS_ORIGIN is loaded:

```bash
docker logs issue-collector-api | grep "CORS Configuration"
```

You should see:
```
🔐 CORS Configuration: {
  allowedOrigins: [ 'https://issue.haahii.com', 'http://localhost:3412', ... ],
  corsOriginValue: 'https://issue.haahii.com,http://localhost:3412,...',
  ...
}
```

If you see `corsOriginValue: 'http://localhost:3412,http://localhost:3411'` (default values), it means the environment variable wasn't loaded correctly.

## Common Issues

### Issue 1: Environment Variable Not Loaded

**Symptoms:**
- Logs show default CORS_ORIGIN values
- CORS errors persist after updating stack.env

**Solution:**
- In Portainer, manually paste `CORS_ORIGIN` into Environment Variables section
- Or ensure `env_file: ../stack.env` is working (check file path)

### Issue 2: Wrong Origin Format

**Symptoms:**
- CORS still blocked even after adding origin

**Solution:**
- CORS origin is **protocol + domain + port** (no path)
- ✅ Correct: `https://issue.haahii.com`
- ❌ Wrong: `https://issue.haahii.com/admin` (path not needed)
- ❌ Wrong: `issue.haahii.com` (missing protocol)

### Issue 3: Case Sensitivity

**Symptoms:**
- Origin matches but still blocked

**Solution:**
- The code now normalizes origins (lowercase) automatically
- But ensure your `CORS_ORIGIN` uses the correct case: `https://issue.haahii.com`

### Issue 4: Container Not Restarted

**Symptoms:**
- Updated stack.env but CORS still blocked

**Solution:**
- **Restart the API container** after updating environment variables:
  ```bash
  docker restart issue-collector-api
  ```

## Testing CORS Configuration

After updating, test the login endpoint:

```bash
curl -X POST https://issue.haahii.com/api/admin/v1/auth/login \
  -H "Origin: https://issue.haahii.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

Check the response headers for `Access-Control-Allow-Origin`.

## Production Checklist

- [ ] `CORS_ORIGIN` includes production domain: `https://issue.haahii.com`
- [ ] `CORS_ORIGIN` includes localhost for testing: `http://localhost:3412,http://localhost:3411`
- [ ] Environment variable is set in Portainer or via env_file
- [ ] API container has been restarted after updating CORS_ORIGIN
- [ ] Logs show correct CORS_ORIGIN value on startup
- [ ] Login request works without CORS errors

## Related Files

- `infra/stack.env` - Environment variables file
- `infra/docker/docker-compose.prod.yml` - Docker Compose configuration
- `apps/api/src/app.ts` - CORS middleware configuration

