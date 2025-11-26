// Test if validation is stripping screenshot data
const http = require('http');

const payload = {
  "projectKey":"proj_YeCKPYTJ9Olcp4UQ",
  "title":"VALIDATION TEST",
  "description":"test",
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

console.log('Testing with validation...');
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
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 422) {
      console.log('❌ Validation Error:', data);
    } else if (res.statusCode === 201) {
      console.log('✅ Issue created');
      console.log('⚠️  Check API server console for:');
      console.log('   [API Service] Checking for screenshot in data');
    } else {
      console.log('Status:', res.statusCode, data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(payloadStr);
req.end();
