# Development Dockerfile for Admin
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy all packages (shared dependencies)
COPY packages ./packages

# Copy Admin app
COPY apps/admin ./apps/admin

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Set working directory to Admin
WORKDIR /app/apps/admin

# Expose port
EXPOSE 3001

# Start development server with hot reload
CMD ["pnpm", "dev"]

