# Fix: Zone Name Mismatch

## Problem

Your `/etc/nginx/nginx.conf` has:
```
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

But the site config (`issue.haahii.com.conf`) needs:
- `zone=api_limit`
- `zone=upload_limit`

## Solution

You have two options:

### Option 1: Replace Main Config (Recommended)

Replace your `/etc/nginx/nginx.conf` with our `nginx-main.conf`:

```bash
# Backup current config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Copy the correct main config
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf

# Test
sudo nginx -t
```

### Option 2: Add Missing Zones to Existing Config

If you want to keep your existing config, add the missing zones:

```bash
# Edit nginx.conf
sudo nano /etc/nginx/nginx.conf
```

Find the `limit_req_zone` line and replace it with:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/s;
```

Or if you want to keep the old `api` zone too, add the new ones:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/s;
```

Then test:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Verify

After fixing, verify zones are defined:

```bash
sudo grep "limit_req_zone" /etc/nginx/nginx.conf
```

You should see:
```
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/s;
```


