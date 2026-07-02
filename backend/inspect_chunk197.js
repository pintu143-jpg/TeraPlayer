const fs = require('fs');
const path = require('path');

function inspectChunk197() {
  const filePath = path.join(__dirname, 'chunks/197.ef4c95c5.chunk.js');
  if (!fs.existsSync(filePath)) {
    console.error('Chunk 197 not found!');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Chunk 197 length:', content.length);
  
  // Search for the sign method export (which was u7) or _t references
  // In imports, they might use e.g. _.u7 or _.something
  // Wait, let's search for "u7" or "sign" or "sign("
  const keywords = ['u7', 'sign', 'temp_info', 'play', 'video', 'src', 'Player', 'player', 'm3u8'];
  keywords.forEach(keyword => {
    console.log(`\n=== Occurrences of "${keyword}" ===`);
    let idx = 0;
    while (true) {
      idx = content.indexOf(keyword, idx);
      if (idx === -1) break;
      
      const start = Math.max(0, idx - 150);
      const end = Math.min(content.length, idx + 250);
      console.log(`Index: ${idx}`);
      console.log(content.substring(start, end));
      console.log('------------------------------------');
      idx += keyword.length;
    }
  });
}

inspectChunk197();
