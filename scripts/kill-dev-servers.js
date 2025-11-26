#!/usr/bin/env node

/**
 * Kill all development servers running on configured ports
 * Ports: API (4501), Admin (4502), Frontend (4503)
 */

const { execSync } = require('child_process');
const os = require('os');

const PORTS = [4501, 4502, 4503];
const platform = os.platform();

console.log('\n' + '='.repeat(60));
console.log('🛑 Stopping all development servers...');
console.log('='.repeat(60) + '\n');

function killPort(port) {
  try {
    if (platform === 'win32') {
      // Windows
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = result.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      });
      
      pids.forEach(pid => {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`✅ Killed process ${pid} on port ${port}`);
        } catch (error) {
          // Process might already be dead
        }
      });
    } else {
      // macOS/Linux
      try {
        // Find PID using lsof
        const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
        const pids = result.trim().split('\n').filter(Boolean);
        
        if (pids.length > 0) {
          pids.forEach(pid => {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
              console.log(`✅ Killed process ${pid} on port ${port}`);
            } catch (error) {
              // Process might already be dead
            }
          });
        } else {
          console.log(`ℹ️  No process found on port ${port}`);
        }
      } catch (error) {
        // lsof returns non-zero exit code when no process is found
        console.log(`ℹ️  No process found on port ${port}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Error checking port ${port}: ${error.message}`);
  }
}

// Kill processes on all ports
PORTS.forEach(port => {
  killPort(port);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Done! All development servers stopped.');
console.log('='.repeat(60) + '\n');

