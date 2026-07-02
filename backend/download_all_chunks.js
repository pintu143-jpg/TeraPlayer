const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chunkMap = {
  5: "e6a8789a", 27: "5ed6642e", 73: "2e8e3990", 77: "d062e4e1", 112: "8d050010",
  129: "3e02c86c", 144: "3a915524", 145: "1447e1e9", 176: "fb5eb433", 192: "5f08140f",
  197: "ef4c95c5", 234: "d09764e8", 254: "fd8c0105", 266: "361a5dd1", 274: "eb4b9695",
  302: "2942ff61", 305: "4f048b85", 314: "dddffc00", 324: "dbfcbc83", 433: "97a7c063",
  475: "95dec8d8", 494: "6f1fb8e7", 515: "64f8f1d9", 583: "cb2244e2", 619: "09c2e758",
  624: "5b36be21", 656: "820c3e20", 658: "2700af19", 743: "888194ef", 745: "ced4af4c",
  755: "f90c873b", 768: "f7ce546b", 806: "f3365c48", 810: "f4f0e69d", 841: "7e9be436",
  849: "e1853b3f", 863: "c19fb527", 910: "ed22c150", 913: "10090f6c", 918: "52dd4b01",
  925: "fa392cd5", 975: "e3a45c4a", 984: "51f79572"
};

const chunksDir = path.join(__dirname, 'chunks');
if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir);
}

async function downloadAndSearch() {
  console.log('Starting chunk downloader & searcher...');
  const results = [];
  
  for (const [id, hash] of Object.entries(chunkMap)) {
    const filename = `${id}.${hash}.chunk.js`;
    const chunkUrl = `https://www.diskwala.com/static/js/${filename}`;
    const chunkPath = path.join(chunksDir, filename);
    
    try {
      let content = '';
      if (fs.existsSync(chunkPath)) {
        content = fs.readFileSync(chunkPath, 'utf8');
      } else {
        console.log(`Downloading chunk ${id} (${filename})...`);
        const res = await axios.get(chunkUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 10000
        });
        content = res.data;
        fs.writeFileSync(chunkPath, content);
      }
      
      // Search inside content
      if (content.includes('JR') || content.includes('temp_info') || content.includes('/app/') || content.includes('/file/')) {
        results.push({ id, filename, content });
      }
      
    } catch (err) {
      console.error(`Failed to download chunk ${id}:`, err.message);
    }
  }
  
  console.log(`\n=== Search Results: found in ${results.length} chunks ===`);
  results.forEach(r => {
    console.log(`\nChunk ID: ${r.id} (${r.filename})`);
    
    // Search for JR references
    const jrRegex = /\bJR\b/g;
    let match;
    while ((match = jrRegex.exec(r.content)) !== null) {
      const idx = match.index;
      console.log(`  Found JR at index ${idx}:`);
      console.log('    ' + r.content.substring(Math.max(0, idx - 100), Math.min(r.content.length, idx + 200)));
    }
    
    // Search for temp_info references
    const tempRegex = /temp_info/g;
    while ((match = tempRegex.exec(r.content)) !== null) {
      const idx = match.index;
      console.log(`  Found temp_info at index ${idx}:`);
      console.log('    ' + r.content.substring(Math.max(0, idx - 100), Math.min(r.content.length, idx + 200)));
    }
  });
}

downloadAndSearch();
