const axios = require('axios');

async function inspectJs() {
  const url = 'https://www.diskwala.com/static/js/main.e578355a.js';
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const content = res.data;
    
    // Find all occurrences of "Appicrypt"
    let idx = 0;
    console.log('--- Context around Appicrypt ---');
    while (true) {
      idx = content.indexOf('Appicrypt', idx);
      if (idx === -1) break;
      
      const start = Math.max(0, idx - 200);
      const end = Math.min(content.length, idx + 300);
      console.log(`Match at index ${idx}:`);
      console.log(content.substring(start, end));
      console.log('-------------------------------------------');
      idx += 9;
    }

    // Find occurrences of "getCryptogram"
    idx = 0;
    console.log('\n--- Context around getCryptogram ---');
    while (true) {
      idx = content.indexOf('getCryptogram', idx);
      if (idx === -1) break;
      
      const start = Math.max(0, idx - 200);
      const end = Math.min(content.length, idx + 300);
      console.log(`Match at index ${idx}:`);
      console.log(content.substring(start, end));
      console.log('-------------------------------------------');
      idx += 13;
    }
    
    // Find occurrences of "crypto.subtle.digest" or signing function "jt"
    idx = 0;
    console.log('\n--- Context around jt function ---');
    while (true) {
      idx = content.indexOf('async function jt', idx);
      if (idx === -1) {
        idx = content.indexOf('const jt', idx);
      }
      if (idx === -1) {
        // Just search for "jt=" or "jt "
        idx = content.indexOf('jt=', idx);
      }
      if (idx === -1) break;
      
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + 400);
      console.log(`Match at index ${idx}:`);
      console.log(content.substring(start, end));
      console.log('-------------------------------------------');
      idx += 10;
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectJs();
