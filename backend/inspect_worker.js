const fs = require('fs');
const path = require('path');

function inspect() {
  const filePath = path.join(__dirname, 'appicrypt-web-0_1_216.js');
  if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Worker script size:', content.length);
  console.log('\n=== Head ===');
  console.log(content.substring(0, 1000));
}

inspect();
