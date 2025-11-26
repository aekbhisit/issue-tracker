const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('=== Screenshot Storage Diagnostic ===\n');

// Test payload
const payload = {
  "projectKey":"proj_YeCKPYTJ9Olcp4UQ",
  "title":"DIAGNOSTIC TEST - " + Date.now(),
  "description":"Testing screenshot storage",
  "severity":"medium",
  "metadata":{
    "url":"http://localhost:4502/admin/projects/2/test",
    "userAgent":"Mozilla/5.0",
    "viewport":{"width":775,"height":795},
    "screen":{"width":1440,"height":900},
    "language":"en-GB",
    "timezone":"Asia/Bangkok",
    "timestamp":new Date().toISOString()
  },
  "screenshot":{
    "screenshot":{
      "dataUrl":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "mimeType":"image/png",
      "fileSize":95,
      "width":1,
      "height":1
    },
    "selector":{
      "cssSelector":"div.test",
      "xpath":"/html/body/div[1]",
      "boundingBox":{"x":10,"y":20,"width":100,"height":50},
      "outerHTML":"<div>test</div>"
    }
  }
};

console.log('1. Checking payload structure...');
console.log('   Has screenshot:', !!payload.screenshot);
console.log('   Has screenshot.screenshot:', !!payload.screenshot?.screenshot);
console.log('   Has selector:', !!payload.screenshot?.selector);
console.log('   DataUrl length:', payload.screenshot?.screenshot?.dataUrl?.length);

console.log('\n2. Checking storage directory...');
const storageDir = path.join(process.cwd(), 'storage', 'uploads', 'screenshots');
console.log('   Path:', storageDir);
console.log('   Exists:', fs.existsSync(storageDir));
if (fs.existsSync(storageDir)) {
  try {
    fs.accessSync(storageDir, fs.constants.W_OK);
    console.log('   Writable: ✅');
  } catch (e) {
    console.log('   Writable: ❌', e.message);
  }
}

console.log('\n3. Submitting issue...');
const payloadStr = JSON.stringify(payload);
const options = {
  hostname: 'localhost',
  port: 4501,
  path: '/api/public/v1/issues',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payloadStr),
    'Origin': 'http://localhost:4502'
  },
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('   Status:', res.statusCode);
    if (res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('   ✅ Issue ID:', result.data.id);
      console.log('\n4. IMPORTANT: Check your API server console logs for:');
      console.log('   - [API Service] Processing screenshot for issue: ...');
      console.log('   - [API Service] Saving screenshot to storage...');
      console.log('   - [API Service] Screenshot saved to storage: ...');
      console.log('   - OR [API Service] Failed to save screenshot ...');
      console.log('\n   The error message will tell you why screenshots are not being saved.');
    } else {
      console.log('   ❌ Error:', data);
    }
  });
});

req.on('error', (e) => {
  console.log('   ❌ Request failed:', e.message);
  console.log('   → Is your API server running on port 4501?');
});

req.on('timeout', () => {
  console.log('   ❌ Request timeout');
  req.destroy();
});

req.write(payloadStr);
req.end();
