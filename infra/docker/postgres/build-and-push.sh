#!/bin/bash
# Build and push PostgreSQL image with pgvector and PostGIS to Harbor
# Usage: ./build-and-push.sh

set -e

# Configuration
HARBOR_URL=${HARBOR_URL:-reg.haahii.com}
HARBOR_PROJECT=${HARBOR_PROJECT:-haahii}
IMAGE_NAME="postgres-pgvector-postgis"
IMAGE_TAG="17.6"
FULL_IMAGE_NAME="${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "🔨 Building PostgreSQL image with pgvector and PostGIS..."
echo "   Image: ${FULL_IMAGE_NAME}"

# Build the image
docker build -f Dockerfile.prod -t ${FULL_IMAGE_NAME} .

echo "✅ Build complete!"
echo "📤 Pushing to Harbor..."

# Push to Harbor
docker push ${FULL_IMAGE_NAME}

echo "✅ Push complete!"
echo ""
echo "You can now use this image in docker-compose.prod.yml:"
echo "  image: ${FULL_IMAGE_NAME}"

