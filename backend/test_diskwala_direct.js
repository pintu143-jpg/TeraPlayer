const axios = require('axios');

async function testTempInfo() {
  const url = 'https://ddudapidd.diskwala.com/api/v1/file/temp_info';
  const fileId = '6a26e1db69eabf872073299e';
  
  try {
    console.log('Sending direct request to temp_info...');
    const response = await axios.post(url, {
      id: fileId
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Origin': 'https://www.diskwala.com',
        'Referer': 'https://www.diskwala.com/'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('API Error Status:', err.response.status);
      console.error('API Error Data:', JSON.stringify(err.response.data));
    } else {
      console.error('Error:', err.message);
    }
  }
}

testTempInfo();
