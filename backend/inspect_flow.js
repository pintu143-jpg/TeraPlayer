const axios = require('axios');

async function inspectFlow() {
  try {
    const res = await axios.get('https://flowvideoplayer.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('HTML Length:', res.data.length);
    
    // Search for API paths, ajax calls, or forms
    const scripts = res.data.match(/<script src="(.*?)">/g);
    console.log('Script tags:', scripts);
    
    // Look for keywords in the body
    const matches = res.data.match(/[\w-/]+\.js/g);
    console.log('JS files mentioned:', matches ? matches.slice(0, 10) : 'none');
    
    // Print a snippet of HTML around the search input
    const inputIdx = res.data.indexOf('Paste terabox video URL');
    if (inputIdx !== -1) {
      console.log('HTML around input:', res.data.substring(inputIdx - 500, inputIdx + 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectFlow().catch(console.error);
