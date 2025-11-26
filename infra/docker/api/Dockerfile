# Development Dockerfile for API
FROM node:18-alpine

# Install OpenSSL for Prisma and curl for health checks
RUN apk add --no-cache openssl libc6-compat curl

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy all packages (shared dependencies)
COPY packages ./packages

# Copy API app
COPY apps/api ./apps/api

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/database
ENV DATABASE_URL="postgresql://postgres:password@postgres:5432/mydb"

# Generate Prisma client
RUN echo "=== Checking Prisma schema files ===" && \
    ls -la ./prisma/ && \
    echo "" && \
    echo "=== Generating Prisma client ===" && \
    pnpm prisma generate && \
    echo "" && \
    echo "=== Verifying Prisma client is accessible ===" && \
    node -e "const { PrismaClient } = require('@prisma/client'); console.log('✅ Prisma Client loaded successfully'); console.log('Available models:', Object.keys(new PrismaClient()).filter(k => !k.startsWith('$') && !k.startsWith('_')).join(', '))"

# Set working directory to API
WORKDIR /app/apps/api

# Expose port
EXPOSE 3000

# Start development server with hot reload
CMD ["pnpm", "dev"]

