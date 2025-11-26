const http = require('http');

const payload = JSON.stringify({
  "projectKey":"proj_YeCKPYTJ9Olcp4UQ",
  "title":"testtest",
  "description":"tests",
  "severity":"medium",
  "metadata":{"url":"http://localhost:4502/admin/projects/2/test","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15","viewport":{"width":775,"height":795},"screen":{"width":1440,"height":900},"language":"en-GB","timezone":"Asia/Bangkok","timestamp":"2025-11-25T06:29:15.352Z"},
  "screenshot":{"screenshot":{"dataUrl":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","mimeType":"image/png","fileSize":95,"width":1,"height":1},"selector":{"cssSelector":"div.test","xpath":"/html/body/div[1]","boundingBox":{"x":10,"y":20,"width":100,"height":50},"outerHTML":"<div class=\"test\">Test</div>"}}
});

const options = {
  hostname: 'localhost',
  port: 4501,
  path: '/api/public/v1/issues',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Origin': 'http://localhost:4502'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', res.statusCode);
    console.log('Body:', data);
    if (res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('\n✅ Issue created with ID:', result.data.id);
      console.log('Now checking database...');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(payload);
req.end();
