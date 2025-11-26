// Check if screenshot data is being processed correctly
const payload = {
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

console.log('Screenshot check:');
console.log('  has screenshot:', !!payload.screenshot);
console.log('  has screenshot.screenshot:', !!payload.screenshot?.screenshot);
console.log('  has screenshot.selector:', !!payload.screenshot?.selector);
console.log('  dataUrl length:', payload.screenshot?.screenshot?.dataUrl?.length);
console.log('  selector keys:', payload.screenshot?.selector ? Object.keys(payload.screenshot.selector) : 'none');
