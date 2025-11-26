-- Enable PostgreSQL extensions
-- This file runs automatically when PostgreSQL container starts (only on first initialization)
-- If database already exists, run these commands manually

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable PostGIS extension for spatial data (already in base image, just enable it)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable other useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text similarity

