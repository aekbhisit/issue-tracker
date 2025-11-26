# Setup Scripts

This directory contains scripts for setting up the project in different environments.

## Hybrid Storage Setup (Recommended)

The hybrid storage setup uses symlinks for fast local development and API server fallback for production/cloud storage.

### Why Hybrid Storage?

- **Development Speed**: Fast with symlinks + Next.js static serving
- **Production Flexibility**: Switch between local/cloud with environment variables
- **Clear Separation**: Public assets separate from user uploads
- **Performance**: Optimal for each environment
- **Scalability**: Ready for cloud storage when needed

### Usage

```bash
# Run symlinks setup
pnpm run setup:symlinks
```

This will create:
- Storage symlinks for all apps (api, admin, frontend)
- Public directory symlinks for admin and frontend
- Production-ready file access

### Environment Configuration

**Development (.env.local):**
```env
USE_API_STORAGE=false
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Production (.env.production):**
```env
USE_API_STORAGE=true
NEXT_PUBLIC_API_URL=https://api.example.com
```

### What the Script Creates

1. **Storage Symlinks**:
   ```
   apps/
   ├── api/
   │   └── storage -> ../../storage
   ├── admin/
   │   └── storage -> ../../storage
   └── frontend/
       └── storage -> ../../storage
   ```

2. **Public Directory Symlinks**:
   ```
   apps/
   ├── admin/
   │   └── public/storage -> ../../../storage
   └── frontend/
       └── public/storage -> ../../../storage
   ```

### How It Works

**Development Mode (USE_API_STORAGE=false):**
- Next.js serves files directly from symlinked `public/storage`
- Fast local file access
- No API calls needed

**Production Mode (USE_API_STORAGE=true):**
- Next.js rewrites `/storage/*` to `${API_URL}/storage/*`
- API server serves files with proper caching
- Supports cloud storage (S3, etc.)

### Prerequisites

- **Linux/macOS**: No special requirements
- **Windows**: Administrator privileges required for creating symlinks

### Manual Setup

If the script doesn't work, you can create symlinks manually:

#### Linux/macOS
```bash
# From project root
ln -sf ../../storage apps/api/storage
ln -sf ../../storage apps/admin/storage
ln -sf ../../storage apps/frontend/storage
ln -sf ../../../storage apps/admin/public/storage
ln -sf ../../../storage apps/frontend/public/storage
```

#### Windows (Command Prompt as Administrator)
```cmd
# From project root
mklink /D apps\api\storage ..\..\storage
mklink /D apps\admin\storage ..\..\storage
mklink /D apps\frontend\storage ..\..\storage
mklink /D apps\admin\public\storage ..\..\..\storage
mklink /D apps\frontend\public\storage ..\..\..\storage
```

#### Windows (PowerShell as Administrator)
```powershell
# From project root
New-Item -ItemType SymbolicLink -Path "apps\api\storage" -Target "..\..\storage"
New-Item -ItemType SymbolicLink -Path "apps\admin\storage" -Target "..\..\storage"
New-Item -ItemType SymbolicLink -Path "apps\frontend\storage" -Target "..\..\storage"
New-Item -ItemType SymbolicLink -Path "apps\admin\public\storage" -Target "..\..\..\storage"
New-Item -ItemType SymbolicLink -Path "apps\frontend\public\storage" -Target "..\..\..\storage"
```

### Verification

After creating symlinks, verify they work:

```bash
# Check if symlinks exist
ls -la apps/*/storage
ls -la apps/*/public/storage

# Test file access
ls apps/api/storage/uploads/images/banners/
ls apps/admin/public/storage/uploads/images/banners/
ls apps/frontend/public/storage/uploads/images/banners/
```

### Troubleshooting

#### Permission Issues
- **Linux/macOS**: Ensure you have write permissions
- **Windows**: Run as Administrator

#### Symlink Already Exists
- Remove existing directory/link first
- Use `-Force` flag in PowerShell

#### Path Issues
- Ensure you're running from project root
- Check relative paths are correct

#### Symlinks Not Working
- Verify the symlinks were created: `ls -la apps/*/storage`
- Check that the target directory exists: `ls -la storage/`

### Production Deployment

For production environments:

1. **Deploy the project** to your server
2. **Run the symlinks setup script**: `pnpm run setup:symlinks`
3. **Set proper permissions** for the storage directory
4. **Start your applications**

### Storage Permissions

Make sure the storage directory has proper permissions:

```bash
# Linux/macOS
chmod -R 755 storage/
chmod -R 777 storage/uploads/temp/

# Windows
icacls storage /grant Everyone:F /T
```

### Docker Support

For Docker deployments, you can mount the storage directory:

```yaml
# docker-compose.yml
services:
  api:
    volumes:
      - ./storage:/app/storage
  admin:
    volumes:
      - ./storage:/app/storage
  frontend:
    volumes:
      - ./storage:/app/storage
```