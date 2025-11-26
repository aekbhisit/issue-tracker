const http = require('http');

const payload = {
  "projectKey":"proj_YeCKPYTJ9Olcp4UQ",
  "title":"VALIDATION TEST - " + Date.now(),
  "description":"Testing if validation strips screenshot",
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
      "cssSelector":"div.test-class",
      "xpath":"/html/body/div[1]",
      "boundingBox":{"x":10,"y":20,"width":100,"height":50},
      "outerHTML":"<div class=\"test\">Test</div>"
    }
  }
};

const payloadStr = JSON.stringify(payload);
console.log('Submitting with screenshot...');
console.log('Payload screenshot exists:', !!payload.screenshot);

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
    console.log('Response:', res.statusCode);
    if (res.statusCode === 201) {
      console.log('✅ Issue created');
      console.log('\n⚠️  Check API server logs for:');
      console.log('   [API Controller] Received issue creation request');
      console.log('   [API Service] Checking for screenshot in data');
      console.log('   [API Service] Processing screenshot OR No screenshot provided');
    } else {
      console.log('❌ Error:', data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(payloadStr);
req.end();
