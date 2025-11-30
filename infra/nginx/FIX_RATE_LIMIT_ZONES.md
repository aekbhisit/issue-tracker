# Fix: "zero size shared memory zone" Error

## Problem

```
[emerg] zero size shared memory zone "api_limit"
nginx: configuration file /etc/nginx/nginx.conf test failed
```

This error means the rate limiting zones (`api_limit` and `upload_limit`) are not defined in `/etc/nginx/nginx.conf`.

## Solution

The rate limiting zones must be defined in the main `nginx.conf` file (in the `http {}` block) BEFORE the site configs are included.

### Step 1: Check Current nginx.conf

```bash
# Check if rate limiting zones are defined
sudo grep -n "limit_req_zone" /etc/nginx/nginx.conf
```

If you see no output, the zones are missing.

### Step 2: Copy Main Config with Zone Definitions

```bash
# Backup current config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d)

# Copy the main config (includes rate limiting zones)
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t
```

### Step 3: Verify Zones Are Defined

```bash
# Check that zones are now present
sudo grep -A 2 "Rate limiting zones" /etc/nginx/nginx.conf
sudo grep "limit_req_zone" /etc/nginx/nginx.conf
```

You should see:
```
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/s;
```

### Step 4: Reload Nginx

```bash
# If test passes, reload
sudo systemctl reload nginx
```

## Why This Happens

Rate limiting zones (`limit_req_zone`) must be defined in the `http {}` block of the main nginx config file. They cannot be defined in site-specific config files (`sites-enabled/*.conf`).

The zones are shared memory areas that nginx uses to track request rates across all server blocks.

## Quick Fix

```bash
# One command to fix it
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf && sudo nginx -t
```

If the test passes, reload nginx:
```bash
sudo systemctl reload nginx
```


