const http = require('http');

const payload = {
  "projectKey":"proj_YeCKPYTJ9Olcp4UQ",
  "title":"TEST AFTER RESTART - " + Date.now(),
  "description":"Testing screenshot storage after API restart",
  "severity":"medium",
  "metadata":{
    "url":"http://localhost:4502/admin/projects/2/test",
    "userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
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
      "cssSelector":"div.test-class-name",
      "xpath":"/html/body/div[2]/div/div/div/div[3]/div/div/div/div[2]/div",
      "boundingBox":{"x":49,"y":320,"width":677,"height":164},
      "outerHTML":"<div class=\"flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800\"><div class=\"flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white\">1</div><div class=\"flex-1\"><h4 class=\"font-semibold text-blue-900 dark:text-blue-100 mb-1\">Find the Report Issue Button</h4></div></div>"
    }
  }
};

console.log('=== Testing Screenshot Storage After Restart ===\n');
console.log('Submitting issue with screenshot...');

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
  timeout: 10000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    if (res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('✅ Issue created with ID:', result.data.id);
      console.log('\nNow checking database...');
      return result.data.id;
    } else {
      console.log('❌ Error:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.log('   → Is API server running on port 4501?');
});

req.write(payloadStr);
req.end();
