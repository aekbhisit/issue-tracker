# Fix: "host not found in upstream" Error

## Problem

```
[emerg] host not found in upstream "api_backend" in /etc/nginx/sites-enabled/issue.haahii.com.conf:28
```

This error means nginx can't find the upstream definitions (`api_backend`, `admin_backend`, `frontend_backend`).

## Solution

The upstreams must be defined in `/etc/nginx/nginx.conf` BEFORE the site configs are included.

### Step 1: Check Current nginx.conf

```bash
sudo cat /etc/nginx/nginx.conf | grep -A 5 "upstream\|include.*sites"
```

If you don't see upstream definitions, proceed to Step 2.

### Step 2: Replace Main nginx.conf

```bash
# Backup current config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d)

# Copy the new main config
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t
```

### Step 3: Update Upstream Backends (if needed)

**If your containers are running on the HOST (not Docker networking):**

The `nginx-main.conf` already has:
```nginx
upstream api_backend {
    server localhost:3410;
}
```

**If your containers are in Docker and nginx is also in Docker:**

Edit `/etc/nginx/nginx.conf` and change to Docker service names:
```nginx
upstream api_backend {
    server api:3410;  # Docker service name
}

upstream admin_backend {
    server admin:3411;  # Docker service name
}

upstream frontend_backend {
    server frontend:3412;  # Docker service name
}
```

**If nginx is on host but containers are in Docker:**

You need to use `host.docker.internal` or the host's IP:
```nginx
upstream api_backend {
    server host.docker.internal:3410;  # Docker Desktop
    # OR
    # server 172.17.0.1:3410;  # Linux Docker bridge IP
}
```

### Step 4: Verify and Reload

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

## Quick Fix Commands

```bash
# 1. Replace main config
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf

# 2. Test
sudo nginx -t

# 3. If test passes, reload
sudo systemctl reload nginx
```


