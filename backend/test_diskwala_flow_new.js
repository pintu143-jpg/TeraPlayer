const axios = require('axios');

async function testDiskwalaSearch(diskwalaUrl) {
  try {
    console.log('Fetching diskwaladownloader homepage for cookies and CSRF...');
    const homepageRes = await axios.get('https://diskwaladownloader.flowvideoplayer.com', {
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

    console.log('CSRF Token:', csrfToken);
    console.log('Cookies:', cookieHeader);

    console.log('\nTesting /searchVideo endpoint...');
    const searchRes = await axios.post('https://diskwaladownloader.flowvideoplayer.com/searchVideo', {
      url: diskwalaUrl
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookieHeader,
        'Referer': 'https://diskwaladownloader.flowvideoplayer.com/',
        'Origin': 'https://diskwaladownloader.flowvideoplayer.com'
      }
    });

    console.log('Status:', searchRes.status);
    console.log('Response:', JSON.stringify(searchRes.data, null, 2));

  } catch (err) {
    if (err.response) {
      console.error('API Error Status:', err.response.status);
      console.error('API Error Data:', JSON.stringify(err.response.data));
    } else {
      console.error('Error:', err.message);
    }
  }
}

// Let's test with the URL from the database/log
const testUrl = 'https://www.diskwala.com/app/6a26e1db69eabf872073299e';
testDiskwalaSearch(testUrl);
