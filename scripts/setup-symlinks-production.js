#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getProjectRoot() {
  let currentDir = __dirname;
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, 'package.json')) && 
        fs.existsSync(path.join(currentDir, 'apps'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return process.cwd();
}

function createSymlink(targetDir, linkName, relativePath) {
  const linkPath = path.join(targetDir, linkName);
  
  log(`🔗 Creating symlink for ${path.basename(targetDir)}...`, 'yellow');
  
  // Remove existing directory/link if it exists
  if (fs.existsSync(linkPath)) {
    log(`   🗑️  Removing existing ${linkName}...`, 'yellow');
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  
  try {
    // Create symlink
    fs.symlinkSync(relativePath, linkPath, 'dir');
    log(`   ✅ Symlink created: ${linkName} -> ${relativePath}`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ Failed to create symlink: ${error.message}`, 'red');
    if (process.platform === 'win32') {
      log(`   💡 Try running as Administrator on Windows`, 'yellow');
    }
    return false;
  }
}

function createPublicSymlink(targetDir, linkName, relativePath) {
  const linkPath = path.join(targetDir, linkName);
  
  log(`🔗 Creating public symlink for ${path.basename(targetDir)}...`, 'yellow');
  
  // Create parent directory if it doesn't exist
  const parentDir = path.dirname(linkPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  
  // Remove existing directory/link if it exists
  if (fs.existsSync(linkPath)) {
    log(`   🗑️  Removing existing ${linkName}...`, 'yellow');
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  
  try {
    // Create symlink
    fs.symlinkSync(relativePath, linkPath, 'dir');
    log(`   ✅ Public symlink created: ${linkName} -> ${relativePath}`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ Failed to create public symlink: ${error.message}`, 'red');
    if (process.platform === 'win32') {
      log(`   💡 Try running as Administrator on Windows`, 'yellow');
    }
    return false;
  }
}

function main() {
  log('🔗 Setting up storage symlinks for production...', 'bright');
  
  const projectRoot = getProjectRoot();
  log(`📁 Project root: ${projectRoot}`, 'cyan');
  
  // Create symlinks for each app
  const apps = ['api', 'admin', 'frontend'];
  const createdSymlinks = [];
  
  apps.forEach(app => {
    const appDir = path.join(projectRoot, 'apps', app);
    if (fs.existsSync(appDir)) {
      const success = createSymlink(appDir, 'storage', '../../storage');
      if (success) {
        createdSymlinks.push(`apps/${app}/storage -> ../../storage`);
      }
    } else {
      log(`   ⚠️  ${app} directory not found, skipping ${app} symlink`, 'yellow');
    }
  });
  
  // Create public symlinks for admin and frontend
  const publicApps = ['admin', 'frontend'];
  publicApps.forEach(app => {
    const appDir = path.join(projectRoot, 'apps', app);
    if (fs.existsSync(appDir)) {
      const success = createPublicSymlink(appDir, 'public/storage', '../../../storage');
      if (success) {
        createdSymlinks.push(`apps/${app}/public/storage -> ../../../storage`);
      }
    } else {
      log(`   ⚠️  ${app} directory not found, skipping ${app} public symlink`, 'yellow');
    }
  });
  
  // Summary
  log('', 'white');
  if (createdSymlinks.length > 0) {
    log('🎉 Production symlinks setup completed!', 'green');
    log('', 'white');
    log('📋 Created symlinks:', 'cyan');
    createdSymlinks.forEach(link => {
      log(`   - ${link}`, 'white');
    });
  } else {
    log('⚠️  No symlinks were created', 'yellow');
  }
  
  log('', 'white');
  log('📁 Storage structure:', 'cyan');
  log('   - storage/uploads/temp/ (temporary uploads)', 'white');
  log('   - storage/upload/images/banners/ (banner images)', 'white');
  log('   - storage/upload/documents/ (document uploads)', 'white');
  log('   - storage/upload/videos/ (video uploads)', 'white');
  log('', 'white');
  
  if (createdSymlinks.length > 0) {
    log('✅ Ready for production!', 'green');
  } else {
    log('⚠️  Run as Administrator to create symlinks', 'yellow');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
