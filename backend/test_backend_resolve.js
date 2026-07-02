const axios = require('axios');

async function testBackendResolve() {
  try {
    console.log('Sending resolve request to local server...');
    const res = await axios.post('http://localhost:5000/api/resolve', {
      url: 'https://www.terabox.app/sharing/link?surl=UfPFe53Xaf9hjvEYG77FbQ'
    }, {
      timeout: 30000
    });
    
    console.log('Server Response Status:', res.status);
    console.log('Server Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('Server Error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testBackendResolve();
