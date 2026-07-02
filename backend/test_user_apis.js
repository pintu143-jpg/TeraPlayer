const axios = require('axios');

async function testDiskwala() {
  const diskwalaUrl = 'https://www.diskwala.com/app/6a26e1db69eabf872073299e';
  const apiUrl = `https://diskwala.litedns.xyz/?token=302d900e-ade7-40b2-8c1e-7e3a3ec83f96&url=${encodeURIComponent(diskwalaUrl)}`;
  console.log('1. Testing DiskWala API:', apiUrl);
  
  try {
    const res = await axios.get(apiUrl, { timeout: 15000 });
    console.log('   Status:', res.status);
    console.log('   Response Keys:', Object.keys(res.data));
    console.log('   Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('   DiskWala Error:', err.response.status, JSON.stringify(err.response.data));
    } else {
      console.error('   DiskWala Error:', err.message);
    }
  }
}

async function testTerabox() {
  const teraboxUrl = 'https://www.terabox.app/sharing/link?surl=UfPFe53Xaf9hjvEYG77FbQ';
  const apiUrl = 'https://express-kingfisher--terabox-video-player-and-downloader-api.apify.actor?token=apify_api_AA2Jq4qoZANTDdqojav1z1kqIvFsDx1uCGMe';
  console.log('\n2. Testing TeraBox Apify Actor:', apiUrl);
  
  try {
    const res = await axios.post(apiUrl, {
      url: teraboxUrl
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });
    console.log('   Status:', res.status);
    console.log('   Response Keys:', Object.keys(res.data));
    console.log('   Response Data Preview:', JSON.stringify(res.data, null, 2).substring(0, 1000));
  } catch (err) {
    if (err.response) {
      console.error('   TeraBox Error:', err.response.status, JSON.stringify(err.response.data));
    } else {
      console.error('   TeraBox Error:', err.message);
    }
  }
}

async function run() {
  await testDiskwala();
  await testTerabox();
}

run().catch(console.error);
