const http = require('http');

// Use the EXACT payload structure from user's request
const payload = {
  "projectKey":"proj_YeCKPYTJ9Olcp4UQ",
  "title":"FULL TEST - " + Date.now(),
  "description":"Full test with complete screenshot data",
  "severity":"medium",
  "metadata":{
    "url":"http://localhost:4502/admin/projects/2/test",
    "userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15",
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
      "width":677,
      "height":200
    },
    "selector":{
      "cssSelector":"div.test-class",
      "xpath":"/html/body/div[2]/div/div/div/div[3]/div/div/div/div[2]/div",
      "boundingBox":{"x":49,"y":320,"width":677,"height":164},
      "outerHTML":"<div class=\"flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800\"><div class=\"flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white\">1</div></div>"
    }
  }
};

const payloadStr = JSON.stringify(payload);
console.log('Payload size:', payloadStr.length, 'bytes');
console.log('Has screenshot:', !!payload.screenshot);
console.log('Has screenshot.screenshot:', !!payload.screenshot?.screenshot);

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
    console.log('\nResponse Status:', res.statusCode);
    if (res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('✅ Issue ID:', result.data.id);
    } else {
      console.log('❌ Error Response:', data);
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(payloadStr);
req.end();
