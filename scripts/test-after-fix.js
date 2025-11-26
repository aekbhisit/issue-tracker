const http = require('http');

const payload = {
  "projectKey":"proj_YeCKPYTJ9Olcp4UQ",
  "title":"TEST AFTER FIX - " + Date.now(),
  "description":"Testing after storage path fix",
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
      "cssSelector":"div.test-fix",
      "xpath":"/html/body/div[1]",
      "boundingBox":{"x":10,"y":20,"width":100,"height":50},
      "outerHTML":"<div>test fix</div>"
    }
  }
};

console.log('Testing after storage path fix...');
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
    if (res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('✅ Issue created:', result.data.id);
    } else {
      console.log('❌ Error:', data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(payloadStr);
req.end();
