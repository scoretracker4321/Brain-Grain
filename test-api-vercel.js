// Quick test script for Vercel API
const https = require('https');

const testData = {
  podSummary: {
    podName: "Test Pod",
    studentCount: 2,
    sessionIndex: 0,
    sessionPhase: "FOUNDATION",
    students: [
      { name: "Test Student 1", grade: "5" },
      { name: "Test Student 2", grade: "5" }
    ]
  },
  prompt: "Generate a simple test plan",
  studentsData: "{}"
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'brain-grain.vercel.app',
  path: '/api/generate-pod-plan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing Vercel API endpoint...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(postData);
req.end();
