const axios = require('axios');

async function testFlowApi(teraboxUrl) {
  try {
    console.log('Step 1: Fetching homepage for cookies and CSRF token...');
    const homepageRes = await axios.get('https://flowvideoplayer.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const csrfMatch = homepageRes.data.match(/<meta name="csrf-token" content="(.*?)"/);
    if (!csrfMatch) {
      console.log('Failed: CSRF token not found in HTML.');
      return;
    }
    const csrfToken = csrfMatch[1];
    console.log('Success: Found CSRF Token:', csrfToken);

    const setCookie = homepageRes.headers['set-cookie'] || [];
    const cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('Success: Got Session Cookies:', cookieHeader);

    console.log('\nStep 2: Sending resolution POST request...');
    const apiRes = await axios.post('https://flowvideoplayer.com/telegram/bot/search/video', {
      url: teraboxUrl
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

const url = 'https://www.terabox.app/sharing/link?surl=cpeZCbc0aV73pFUxfgcTtg';
testFlowApi(url);
