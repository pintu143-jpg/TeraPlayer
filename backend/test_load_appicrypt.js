const path = require('path');
const fs = require('fs');

async function testLoad() {
  const filePath = path.join(__dirname, 'appicrypt-web-f-0_1_216.js');
  
  // Since it uses ES 'export', let's read the file and adapt it to CJS module if needed,
  // or use dynamic import() if supported. Let's see what is exported.
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Find all exports
  const exportsMatches = code.match(/export\s+\{[\s\S]*?\}/g) || [];
  console.log('Exports statement:', exportsMatches);
  
  // Find functions defined with 'export function'
  const exportFunctions = code.match(/export\s+function\s+[a-zA-Z0-9_]+/g) || [];
  console.log('Exported functions:', exportFunctions);
}

testLoad();
