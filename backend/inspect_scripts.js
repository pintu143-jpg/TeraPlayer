const fs = require('fs');
const path = require('path');

function inspect() {
  const filePath = path.join(__dirname, 'diskwala_link_page.html');
  if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    count++;
    console.log(`\n=== Script Tag ${count} ===`);
    console.log(match[0].substring(0, 500));
    if (match[0].length > 500) {
      console.log('... [TRUNCATED] ...');
    }
  }
}

inspect();
