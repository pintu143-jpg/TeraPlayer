const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function saveHtml() {
  try {
    const res = await axios.get('https://diskwaladownloader.flowvideoplayer.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    fs.writeFileSync(path.join(__dirname, 'diskwala_page.html'), res.data);
    console.log('Saved HTML to backend/diskwala_page.html');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

saveHtml();
