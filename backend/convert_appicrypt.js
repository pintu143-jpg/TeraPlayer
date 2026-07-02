const fs = require('fs');
const path = require('path');

function convert() {
  const srcPath = path.join(__dirname, 'appicrypt-web-f-0_1_216.js');
  const destPath = path.join(__dirname, 'appicrypt_cjs.js');
  
  if (!fs.existsSync(srcPath)) {
    console.error('Source file not found!');
    return;
  }
  
  let content = fs.readFileSync(srcPath, 'utf8');
  
  // Replace ES export functions with normal functions
  content = content.replace(/export async function/g, 'async function');
  content = content.replace(/export function/g, 'function');
  
  // Replace import.meta.url with standard CJS filename URL
  content = content.replace(/import\.meta\.url/g, '("file:///" + __filename)');
  
  // Add exports at the bottom
  content += `
// CommonJS Exports
module.exports = {
  setMagicFile,
  main_js,
  getCryptogram
};
`;
  
  fs.writeFileSync(destPath, content);
  console.log('Successfully converted and saved to appicrypt_cjs.js');
}

convert();
