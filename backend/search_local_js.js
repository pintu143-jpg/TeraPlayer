const fs = require('fs');
const path = require('path');

function searchLocal() {
  const filePath = path.join(__dirname, 'main.js');
  if (!fs.existsSync(filePath)) {
    console.error('main.js does not exist!');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('File size:', content.length);

  // Look for Appicrypt matches
  console.log('--- Context around Appicrypt ---');
  let idx = 0;
  while (true) {
    idx = content.indexOf('Appicrypt', idx);
    if (idx === -1) break;
    
    const start = Math.max(0, idx - 250);
    const end = Math.min(content.length, idx + 350);
    console.log(`Match at index ${idx}:`);
    console.log(content.substring(start, end));
    console.log('-------------------------------------------');
    idx += 9;
  }

  // Look for getCryptogram matches
  console.log('\n--- Context around getCryptogram ---');
  idx = 0;
  while (true) {
    idx = content.indexOf('getCryptogram', idx);
    if (idx === -1) break;
    
    const start = Math.max(0, idx - 250);
    const end = Math.min(content.length, idx + 350);
    console.log(`Match at index ${idx}:`);
    console.log(content.substring(start, end));
    console.log('-------------------------------------------');
    idx += 13;
  }

  // Look for jt definition context
  console.log('\n--- Context around jt function ---');
  idx = 0;
  while (true) {
    idx = content.indexOf('jt=async', idx);
    if (idx === -1) {
      idx = content.indexOf('function jt', idx);
    }
    if (idx === -1) {
      idx = content.indexOf('jt=', idx);
    }
    if (idx === -1) break;
    
    const start = Math.max(0, idx - 150);
    const end = Math.min(content.length, idx + 450);
    console.log(`Match at index ${idx}:`);
    console.log(content.substring(start, end));
    console.log('-------------------------------------------');
    idx += 5;
  }
}

searchLocal();
