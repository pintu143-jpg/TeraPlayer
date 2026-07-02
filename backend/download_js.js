const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadJs() {
  const url = 'https://www.diskwala.com/static/js/main.e578355a.js';
  try {
    console.log('Downloading JS bundle...');
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    fs.writeFileSync(path.join(__dirname, 'main.js'), res.data);
    console.log('Successfully saved to main.js');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

downloadJs();
