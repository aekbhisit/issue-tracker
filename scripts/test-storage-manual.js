/**
 * Manual test script to verify storage functionality
 * Run: node scripts/test-storage-manual.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== Manual Storage Test ===\n');

// Test 1: Check storage directory
console.log('1. Checking storage directory...');
const storageDir = path.join(process.cwd(), 'storage', 'uploads', 'screenshots');
if (!fs.existsSync(storageDir)) {
  console.log('   ❌ Directory does not exist, creating...');
  fs.mkdirSync(storageDir, { recursive: true });
  console.log('   ✅ Directory created');
} else {
  console.log('   ✅ Directory exists');
}

// Test 2: Test file write permissions
console.log('\n2. Testing file write permissions...');
const testDir = path.join(storageDir, '99999');
fs.mkdirSync(testDir, { recursive: true });

const testFile = path.join(testDir, 'test.png');
const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

try {
  fs.writeFileSync(testFile, testBuffer);
  const exists = fs.existsSync(testFile);
  const stats = fs.statSync(testFile);
  
  if (exists && stats.size > 0) {
    console.log('   ✅ File write works');
    console.log('   ✅ File size:', stats.size, 'bytes');
    
    // Cleanup
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir);
    console.log('   ✅ Test file cleaned up');
  } else {
    console.log('   ❌ File write failed');
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Test 3: Verify element selector JSON structure
console.log('\n3. Testing element selector JSON structure...');
const testSelector = {
  cssSelector: 'div.test-class',
  xpath: '/html/body/div[1]',
  boundingBox: { x: 10, y: 20, width: 100, height: 50 },
  outerHTML: '<div class="test-class">Test</div>'
};

try {
  const jsonString = JSON.stringify(testSelector);
  const parsed = JSON.parse(jsonString);
  
  const hasAllFields = 
    parsed.cssSelector && 
    parsed.xpath && 
    parsed.outerHTML && 
    parsed.boundingBox;
  
  if (hasAllFields) {
    console.log('   ✅ JSON structure valid');
    console.log('   ✅ All required fields present');
    console.log('   ✅ JSON length:', jsonString.length, 'chars');
  } else {
    console.log('   ❌ Missing fields');
  }
} catch (error) {
  console.log('   ❌ JSON error:', error.message);
}

// Test 4: Check database connection (if Prisma available)
console.log('\n4. Database check...');
console.log('   Run: cd infra/database && node -e "const {PrismaClient}=require(\'@prisma/client\');const p=new PrismaClient();p.issueScreenshot.findMany({take:5}).then(r=>{console.log(\'Screenshots:\',r.length);p.$disconnect()})"');

console.log('\n=== Test Complete ===');
console.log('\nTo verify with real data:');
console.log('1. Submit a new issue with screenshot using inspect mode');
console.log('2. Check API server logs for [API Service] messages');
console.log('3. Run database check above');
console.log('4. Check files: ls -lah storage/uploads/screenshots/*/');


