const axios = require('axios');

async function testApify(teraboxUrl) {
  const url = 'https://express-kingfisher--terabox-video-player-and-downloader-api.apify.actor?token=apify_api_AA2Jq4qoZANTDdqojav1z1kqIvFsDx1uCGMe';
  console.log('Requesting Apify URL:', url);
  
  try {
    const res = await axios.post(url, {
      url: teraboxUrl
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('Status:', res.status);
    console.log('Response Data keys:', Object.keys(res.data));
    console.log('Full Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('API Error Status:', err.response.status);
      console.error('API Error Data:', JSON.stringify(err.response.data).substring(0, 1000));
    } else {
      console.error('Error:', err.message);
    }
  }
}

// Test with the surl that we successfully resolved earlier
testApify('https://www.terabox.app/sharing/link?surl=UfPFe53Xaf9hjvEYG77FbQ');
