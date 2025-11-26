# Storage Directory

This directory contains uploaded files and static assets.

## Structure

- `uploads/` - User uploaded files
  - `images/` - Image files
    - `products/` - Product images
    - `banners/` - Banner images
    - `avatars/` - User avatars
    - `reviews/` - Review images
  - `documents/` - Document files
  - `temp/` - Temporary files (auto-cleanup after 24h)

- `public/` - Public static files
- `backups/` - Database backups

## Environment-Specific

### Development
- Files stored locally in this directory
- Served by API server at `/uploads`

### Production
- Recommended: Use cloud storage (S3, GCS)
- Alternative: Nginx serves files from mounted volume

## Security

- Validate file types before upload
- Limit file sizes
- Use unique filenames
- Never execute uploaded files

