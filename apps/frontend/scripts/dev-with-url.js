#!/usr/bin/env node

/**
 * Custom dev script that shows URL when Next.js server starts
 */

const { spawn } = require('child_process');
const PORT = process.env.PORT || 4503;
const HOST = process.env.HOST || 'localhost';

console.log('\n' + '='.repeat(60));
console.log('🚀 Starting Frontend App...');
console.log('='.repeat(60) + '\n');

let urlShown = false;

const nextDev = spawn('next', ['dev', '-p', PORT.toString()], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: PORT.toString(),
  },
});

// Show URL after Next.js starts (it shows "Ready" message)
// We'll show our custom message after a short delay
setTimeout(() => {
  if (!urlShown) {
    urlShown = true;
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Frontend App running on http://${HOST}:${PORT}`);
    console.log(`📍 Frontend URL: http://${HOST}:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60) + '\n');
  }
}, 4000);

nextDev.on('close', (code) => {
  process.exit(code);
});

nextDev.on('error', (error) => {
  console.error('❌ Failed to start frontend server:', error);
  process.exit(1);
});

