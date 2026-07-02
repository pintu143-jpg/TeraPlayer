const fs = require('fs');
const path = require('path');

function inspect() {
  const filePath = path.join(__dirname, 'appicrypt-web-f-0_1_216.js');
  if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('File size:', content.length);
  
  // Look for export or module.exports
  console.log('Includes export:', content.includes('export'));
  console.log('Includes module.exports:', content.includes('module.exports'));
  
  // Print the first 500 characters of the file
  console.log('\n=== File Head ===');
  console.log(content.substring(0, 800));
}

inspect();
