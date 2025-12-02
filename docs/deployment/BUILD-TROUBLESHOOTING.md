# Build Troubleshooting Guide

## Common Build Errors

### 1. Build Fails with "No build manifest found"

**Symptoms:**
- Docker build fails with exit code 1
- Error message: "No build manifest found"
- `.next/build-manifest.json` doesn't exist

**Root Causes:**
1. **TypeScript/ESLint Errors**: Next.js build fails due to type errors or linting issues
2. **Missing Dependencies**: Workspace packages (`@workspace/types`, `@workspace/utils`) not built
3. **Module Resolution Issues**: Next.js can't resolve workspace packages
4. **Memory Issues**: Build runs out of memory during compilation

**Solutions:**

#### Check Build Logs
The Dockerfile now captures build output to `/tmp/build.log`. Check the full error output:

```bash
# In Jenkins build logs, look for:
📋 Full Build Error Output:
==========================================
[actual error messages here]
==========================================
```

#### Fix TypeScript Errors
```bash
cd apps/admin
pnpm typecheck
```

Fix any TypeScript errors before rebuilding.

#### Verify Workspace Packages
Ensure workspace packages are built before admin app:

```bash
# Build workspace packages
pnpm --filter @workspace/types build
pnpm --filter @workspace/utils build

# Verify dist folders exist
ls -la packages/types/dist
ls -la packages/utils/dist
```

#### Check Module Resolution
Verify that Next.js can find workspace packages:

```bash
# Check if packages are in node_modules
ls -la node_modules/@workspace
ls -la apps/admin/node_modules/@workspace
```

#### Increase Build Memory (if needed)
If build fails due to memory:

```dockerfile
# In Dockerfile, add before build step:
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. "Module not found: Can't resolve '@workspace/types'"

**Symptoms:**
- Build error: `Module not found: Can't resolve '@workspace/types'`
- TypeScript compilation fails

**Solutions:**

1. **Verify workspace packages are built:**
   ```bash
   # In Dockerfile build stage, before building admin:
   RUN pnpm --filter @workspace/types build
   RUN pnpm --filter @workspace/utils build
   ```

2. **Check `transpilePackages` in `next.config.js`:**
   ```js
   transpilePackages: ['@workspace/types', '@workspace/utils'],
   ```

3. **Verify `pnpm-workspace.yaml` includes packages:**
   ```yaml
   packages:
     - 'packages/*'
     - 'apps/*'
   ```

### 3. "Next.js not found" Error

**Symptoms:**
- Error: `Next.js not found`
- `ls: /app/node_modules/.bin/next: No such file or directory`

**Solutions:**

1. **Verify Next.js is installed:**
   ```bash
   # In Dockerfile, after pnpm install:
   RUN test -d node_modules/next || test -d apps/admin/node_modules/next || \
       (echo "❌ Next.js not found!" && find /app -name "next" -type d && exit 1)
   ```

2. **Check installation command:**
   ```bash
   # Should install all dependencies including dev deps for build:
   pnpm install --frozen-lockfile
   ```

### 4. Build Succeeds But `.next` Directory Missing

**Symptoms:**
- Build completes but `.next` directory not found
- Next.js server can't start

**Solutions:**

1. **Check build output location:**
   ```bash
   # Next.js might build to different location
   find /app -name ".next" -type d
   ```

2. **Verify working directory:**
   ```bash
   # In Dockerfile, ensure WORKDIR is correct:
   WORKDIR /app/apps/admin
   ```

3. **Check Next.js output mode:**
   ```js
   // In next.config.js, if using standalone:
   output: 'standalone', // This changes output location
   ```

## Debugging Build Issues

### Step 1: Check Full Build Logs

The updated Dockerfile now shows full build output when it fails. Look for:

```
📋 Full Build Error Output:
==========================================
[error messages]
==========================================
```

### Step 2: Run Build Locally

Test build locally to reproduce the issue:

```bash
cd apps/admin
pnpm install
pnpm build
```

### Step 3: Check TypeScript

```bash
cd apps/admin
pnpm typecheck
```

### Step 4: Verify Dependencies

```bash
# Check workspace packages are built
ls -la packages/types/dist
ls -la packages/utils/dist

# Check Next.js is installed
ls -la node_modules/next
ls -la apps/admin/node_modules/next
```

### Step 5: Check Docker Build Context

Ensure Docker build is run from repo root:

```bash
# Correct:
docker build -f infra/docker/admin/Dockerfile.prod .

# Wrong:
cd infra/docker/admin
docker build -f Dockerfile.prod .
```

## Prevention

### Pre-Commit Checks

Add pre-commit hooks to catch errors early:

```bash
# In package.json scripts:
"prebuild": "pnpm --filter @workspace/types build && pnpm --filter @workspace/utils build",
"build": "next build"
```

### CI/CD Validation

In Jenkinsfile, add validation step:

```groovy
stage('Validate') {
    steps {
        sh 'cd apps/admin && pnpm typecheck'
        sh 'pnpm --filter @workspace/types build'
        sh 'pnpm --filter @workspace/utils build'
    }
}
```

## Quick Fixes

### Temporary: Ignore TypeScript Errors

**⚠️ Only for debugging - fix errors properly!**

```js
// In next.config.js:
typescript: {
  ignoreBuildErrors: true, // ⚠️ Temporary only!
},
eslint: {
  ignoreDuringBuilds: true, // ⚠️ Temporary only!
}
```

### Clear Build Cache

```bash
# Clear Next.js cache
rm -rf apps/admin/.next

# Clear Docker build cache
docker build --no-cache -f infra/docker/admin/Dockerfile.prod .
```

## Getting Help

If build still fails:

1. **Check full build logs** (now captured in Dockerfile)
2. **Run build locally** to reproduce
3. **Check TypeScript errors** with `pnpm typecheck`
4. **Verify workspace packages** are built
5. **Check Docker build context** is correct


