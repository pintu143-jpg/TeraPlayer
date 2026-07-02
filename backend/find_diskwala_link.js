const axios = require('axios');

async function findDiskwalaLink() {
  try {
    const res = await axios.get('https://flowvideoplayer.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const matches = res.data.match(/<a[\s\S]*?href=["'](.*?)["'][\s\S]*?>[\s\S]*?Diskwala[\s\S]*?<\/a>/gi);
    console.log('Matches:', matches);
  } catch (err) {
    console.error(err);
  }
}

findDiskwalaLink();
