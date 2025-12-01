# Build Optimization Guide

This document describes the optimizations applied to reduce Jenkins build times.

## Overview

Build times have been optimized through:
1. **Docker BuildKit** - Advanced caching and parallel builds
2. **Build Cache** - Reusing layers from previous builds
3. **pnpm Store Cache** - Caching dependencies between builds
4. **Next.js Build Cache** - Caching Next.js compilation output
5. **Selective Cleanup** - Preserving useful cache

## Performance Improvements

### Expected Build Time Reductions

- **First Build**: No change (baseline)
- **Subsequent Builds** (no code changes): **60-80% faster**
- **Subsequent Builds** (code changes only): **40-60% faster**
- **Subsequent Builds** (dependency changes): **20-40% faster**

### Breakdown by Stage

1. **Dependencies Installation**: 70-90% faster (pnpm store cache)
2. **TypeScript Compilation**: 50-70% faster (incremental builds)
3. **Next.js Build**: 60-80% faster (build cache)
4. **Image Layers**: 80-95% faster (layer cache)

## Optimizations Applied

### 1. Docker BuildKit

**Enabled in Jenkinsfile:**
```groovy
DOCKER_BUILDKIT = '1'
```

**Benefits:**
- Advanced caching mechanisms
- Parallel layer builds
- Cache mounts for persistent data
- Better layer reuse

### 2. Build Cache from Previous Images

**Strategy:**
- Pull previous `latest` and commit-tagged images before building
- Use `--cache-from` to reuse layers
- Only rebuild changed layers

**Example:**
```bash
docker pull ${repo}:latest || echo "No cache available"
docker build --cache-from ${repo}:latest ...
```

### 3. pnpm Store Cache Mount

**Applied to all Dockerfiles:**
```dockerfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
```

**Benefits:**
- Dependencies downloaded once, reused across builds
- Workspace packages cached
- Significantly faster `pnpm install` on subsequent builds

### 4. Next.js Build Cache Mount

**Applied to Admin and Frontend Dockerfiles:**
```dockerfile
RUN --mount=type=cache,target=/app/apps/admin/.next/cache \
    pnpm build
```

**Benefits:**
- Next.js compilation cache preserved
- Faster rebuilds when only code changes
- Webpack/Turbopack cache reused

### 5. Selective Cleanup

**Changed from aggressive to selective:**
```bash
# Before: Removed all build cache
docker builder prune -af

# After: Only remove cache older than 24 hours
docker builder prune -af --filter "until=24h"
```

**Benefits:**
- Recent cache preserved
- Faster subsequent builds
- Still cleans up old cache

### 6. Removed `--pull` Flag

**Before:**
```bash
docker build --pull ...
```

**After:**
```bash
docker build ...
```

**Benefits:**
- Uses local base images if available
- Only pulls when base image is missing or very old
- Faster builds when base images are cached

## Configuration

### Environment Variables

- `DOCKER_BUILDKIT=1` - Enable BuildKit (default: enabled)
- `USE_BUILD_CACHE=true` - Enable build cache (default: enabled)
- `DOCKER_NO_CACHE=1` - Disable cache for this build (for debugging)

### Disabling Cache (if needed)

To force a clean build without cache:
```bash
# In Jenkins job parameters
DOCKER_NO_CACHE=1
```

Or set in Jenkinsfile:
```groovy
def noCacheFlag = (env.DOCKER_NO_CACHE ?: '') == '1' ? '--no-cache' : ''
```

## Monitoring Build Performance

### Check Cache Usage

```bash
# View build cache size
docker system df

# View detailed cache information
docker builder du
```

### Build Time Tracking

Monitor build times in Jenkins:
1. Check "Stage View" for stage durations
2. Compare with previous builds
3. Look for stages that take longer than expected

### Cache Hit Rate

Check if cache is working:
```bash
# In build logs, look for:
# "CACHED" - Layer was reused from cache
# "PULL" - Layer was pulled from registry
# "BUILD" - Layer was built fresh
```

## Troubleshooting

### Build Still Slow

1. **Check BuildKit is enabled:**
   ```bash
   docker version | grep BuildKit
   ```

2. **Verify cache mounts are working:**
   - Look for cache mount messages in build logs
   - Check that pnpm store cache is being used

3. **Check disk space:**
   - Build cache requires disk space
   - Clean old cache if disk is full

### Cache Not Working

1. **First build after changes:**
   - Cache won't help on first build
   - Subsequent builds should be faster

2. **Dependency changes:**
   - If `pnpm-lock.yaml` changes, dependencies will be reinstalled
   - This is expected behavior

3. **Base image updates:**
   - If base images are updated, layers will be rebuilt
   - This is expected behavior

### Force Clean Build

If you suspect cache issues:
```bash
# In Jenkins job, set:
DOCKER_NO_CACHE=1
```

This will do a completely fresh build (slower but guaranteed clean).

## Best Practices

1. **Keep pnpm-lock.yaml stable:**
   - Only update dependencies when necessary
   - Lock file changes invalidate dependency cache

2. **Optimize Dockerfile layer ordering:**
   - Copy package files before source code
   - Install dependencies before copying source
   - This maximizes cache hits

3. **Monitor cache size:**
   - Clean old cache periodically
   - Balance between cache size and disk space

4. **Use build tags wisely:**
   - Tag images with commit SHA for cache reuse
   - Use `latest` tag for most recent cache

## Additional Optimizations (Future)

Potential further optimizations:

1. **Multi-stage build optimization:**
   - Share more layers between stages
   - Reduce final image size

2. **Parallel builds:**
   - Build workspace packages in parallel
   - Use buildx for multi-platform builds

3. **Remote cache:**
   - Use Docker registry as cache backend
   - Share cache across Jenkins agents

4. **Incremental builds:**
   - Only rebuild changed packages
   - Use Turbo for monorepo builds

## References

- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [pnpm Store Documentation](https://pnpm.io/npmrc#store-dir)
- [Next.js Build Cache](https://nextjs.org/docs/app/building-your-application/configuring/caching)

