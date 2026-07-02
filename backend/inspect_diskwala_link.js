const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function inspectDiskwalaLink() {
  const url = 'https://www.diskwala.com/app/6a26e1db69eabf872073299e';
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    console.log('HTML Length:', res.data.length);
    fs.writeFileSync(path.join(__dirname, 'diskwala_link_page.html'), res.data);
    console.log('Saved to diskwala_link_page.html');
    
    // Check if there are script tags containing player or source
    const scriptMatches = res.data.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
    console.log(`Found ${scriptMatches.length} script tags`);
    
    // Look for video tags or iframes
    const videoMatches = res.data.match(/<video[\s\S]*?>/gi);
    console.log('Video tags:', videoMatches);
    
    const iframeMatches = res.data.match(/<iframe[\s\S]*?>/gi);
    console.log('Iframe tags:', iframeMatches);
    
    // Look for links or sources
    const sources = res.data.match(/source[\s\S]*?src=["'](.*?)["']/gi);
    console.log('Source tags:', sources);
    
    // Look for stream links (like .m3u8, .mp4, get_file, etc.)
    const m3u8Matches = res.data.match(/https?:\/\/[^\s"'`<>]*?\.m3u8[^\s"'`<>]*?/gi);
    console.log('m3u8 links:', m3u8Matches);
    
    const mp4Matches = res.data.match(/https?:\/\/[^\s"'`<>]*?\.mp4[^\s"'`<>]*?/gi);
    console.log('mp4 links:', mp4Matches);
    
  } catch (err) {
    console.error('Error fetching DiskWala link:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
    }
  }
}

inspectDiskwalaLink();
