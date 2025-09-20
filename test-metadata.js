const http = require('http');

// Simple test to verify metadata is returned
console.log('Testing metadata return...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/?q=cat',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:');
  
  // Check for our custom metadata headers
  let hasMetadata = false;
  Object.keys(res.headers).forEach(header => {
    if (header.startsWith('x-original')) {
      console.log(`  ${header}: ${res.headers[header]}`);
      hasMetadata = true;
    }
  });
  
  if (hasMetadata) {
    console.log('\n✅ Metadata headers are being returned correctly!');
  } else {
    console.log('\n❌ No metadata headers found');
  }
  
  // Save the image to verify it's still working
  const fs = require('fs');
  const file = fs.createWriteStream('test-image.jpg');
  res.pipe(file);
  
  file.on('finish', () => {
    console.log('\n💾 Image saved as test-image.jpg');
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Problem with request: ${e.message}`);
});

req.end();