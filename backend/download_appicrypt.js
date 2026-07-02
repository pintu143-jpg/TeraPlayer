const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadAppicrypt() {
  const url = 'https://www.diskwala.com/pkg/appicrypt-web-f-0_1_216.js';
  try {
    console.log('Downloading AppiCrypt Web SDK...');
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    fs.writeFileSync(path.join(__dirname, 'appicrypt-web-f-0_1_216.js'), res.data);
    console.log('Successfully saved to appicrypt-web-f-0_1_216.js');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

downloadAppicrypt();
