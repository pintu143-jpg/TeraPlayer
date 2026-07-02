const axios = require('axios');

async function testDiskwalaFlow(diskwalaUrl) {
  try {
    console.log('Fetching homepage for cookies and CSRF...');
    const homepageRes = await axios.get('https://flowvideoplayer.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const csrfMatch = homepageRes.data.match(/<meta name="csrf-token" content="(.*?)"/);
    if (!csrfMatch) {
      console.log('Failed to parse CSRF Token.');
      return;
    }
    const csrfToken = csrfMatch[1];
    const setCookie = homepageRes.headers['set-cookie'] || [];
    const cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');

    console.log('Sending resolution POST request for DiskWala...');
    const apiRes = await axios.post('https://flowvideoplayer.com/telegram/bot/search/video', {
      url: diskwalaUrl
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookieHeader,
        'Referer': 'https://flowvideoplayer.com/',
        'Origin': 'https://flowvideoplayer.com'
      }
    });

    console.log('Status:', apiRes.status);
    console.log('Response:', JSON.stringify(apiRes.data, null, 2));

  } catch (err) {
    if (err.response) {
      console.error('API Error Status:', err.response.status);
      console.error('API Error Data:', JSON.stringify(err.response.data).substring(0, 1000));
    } else {
      console.error('Error:', err.message);
    }
  }
}

// Using the diskwala link from the server log
testDiskwalaFlow('https://www.diskwala.com/app/6a26e1db69eabf872073299e');
