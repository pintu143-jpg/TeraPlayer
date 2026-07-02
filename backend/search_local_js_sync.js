const fs = require('fs');
const path = require('path');

function search() {
  const filePath = path.join(__dirname, 'appicrypt_worker_cjs.js');
  if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /__wbg_length_186546c51cd61acd/g;
  let match;
  console.log('--- __wbg_length_186546c51cd61acd occurrences ---');
  while ((match = regex.exec(content)) !== null) {
    const idx = match.index;
    console.log(`Index: ${idx}`);
    console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 250)));
    console.log('------------------------------------');
  }
}

search();
