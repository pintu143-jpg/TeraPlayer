const axios = require('axios');

async function testFetch() {
  const urls = [
    'https://www.diskwala.com/appicrypt-web-0_1_216.js',
    'https://diskwala.com/appicrypt-web-0_1_216.js',
    'https://www.diskwala.com/pkg/appicrypt-web-0_1_216.js',
    'https://diskwala.com/pkg/appicrypt-web-0_1_216.js'
  ];
  
  for (const url of urls) {
    try {
      console.log(`Fetching: ${url}`);
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.diskwala.com/',
          'Origin': 'https://www.diskwala.com'
        }
      });
      console.log(`  Status: ${res.status}, Length: ${res.data.length}`);
      console.log(`  Preview: ${res.data.substring(0, 100).replace(/\r?\n/g, ' ')}`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
}

testFetch();
