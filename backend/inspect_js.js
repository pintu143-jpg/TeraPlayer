const axios = require('axios');

async function findSearchVideo() {
  try {
    const res = await axios.get('https://flowvideoplayer.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const idx = res.data.indexOf('searchVideo');
    if (idx !== -1) {
      console.log('Found searchVideo string at index:', idx);
    }
    
    const scriptBlocks = res.data.match(/<script>([\s\S]*?)<\/script>/g);
    if (scriptBlocks) {
      console.log(`Found ${scriptBlocks.length} inline script blocks.`);
      let i = 0;
      for (const block of scriptBlocks) {
        i++;
        if (block.includes('searchVideo') || block.includes('watch') || block.includes('videoUrl') || block.includes('post')) {
          console.log(`\n--- Match in inline block #${i} ---`);
          console.log(block.substring(0, 1500));
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

findSearchVideo();
