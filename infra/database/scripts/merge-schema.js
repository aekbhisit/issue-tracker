#!/usr/bin/env node

/**
 * Merge Prisma Schema Files
 * 
 * Combines all schema files from prisma/schema/ into prisma/schema.prisma
 * Prisma doesn't natively support multi-file schemas, so we merge them
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_DIR = path.join(__dirname, '../prisma/schema');
const SCHEMA_FILE = path.join(__dirname, '../prisma/schema.prisma');
const BASE_SCHEMA = path.join(__dirname, '../prisma/schema.prisma.base');

// Base schema content (generator + datasource)
const BASE_CONTENT = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

function mergeSchemas() {
  console.log('📋 Merging Prisma schema files...\n');

  // Read all schema files from schema/ directory
  const schemaFiles = fs.readdirSync(SCHEMA_DIR)
    .filter(file => file.endsWith('.prisma'))
    .sort(); // Sort for consistent ordering

  console.log(`Found ${schemaFiles.length} schema files:`);
  schemaFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  // Combine all schema files
  let mergedContent = BASE_CONTENT + '\n';
  
  for (const file of schemaFiles) {
    const filePath = path.join(SCHEMA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    mergedContent += `// ============================================\n`;
    mergedContent += `// ${file}\n`;
    mergedContent += `// ============================================\n\n`;
    mergedContent += content;
    mergedContent += '\n\n';
  }

  // Write merged schema
  fs.writeFileSync(SCHEMA_FILE, mergedContent, 'utf8');
  
  console.log('✅ Schema files merged successfully!');
  console.log(`   Output: ${SCHEMA_FILE}\n`);
}

mergeSchemas();

