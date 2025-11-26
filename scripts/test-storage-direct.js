// Quick test script to check storage
const fs = require('fs');
const path = require('path');

const storageDir = path.join(process.cwd(), 'storage', 'uploads', 'screenshots');
console.log('Checking storage directory:', storageDir);
console.log('Exists:', fs.existsSync(storageDir));

if (fs.existsSync(storageDir)) {
  const issues = fs.readdirSync(storageDir);
  console.log('\nIssue directories found:', issues.length);
  
  issues.forEach(issueId => {
    const issueDir = path.join(storageDir, issueId);
    const files = fs.readdirSync(issueDir);
    console.log(`  Issue ${issueId}: ${files.length} file(s)`);
    files.forEach(file => {
      const filePath = path.join(issueDir, file);
      const stats = fs.statSync(filePath);
      console.log(`    - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
  });
} else {
  console.log('Storage directory does not exist');
}
