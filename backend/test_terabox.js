const axios = require('axios');

async function testTeraBox(surl) {
  const shorturl = '1' + surl;
  const url = `https://www.terabox.com/share/list?app_id=250528&shorturl=${shorturl}&root=1`;
  console.log('Requesting URL:', url);
  
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.terabox.com/sharing/link?surl=' + surl
      },
      timeout: 5000
    });
    
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data).substring(0, 1000));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Using the surl from the user screenshot
testTeraBox('cpeZCbc0aV73pFUxfgcTtg');
