const axios = require('axios');

async function testFreeApis(teraboxUrl) {
  const apis = [
    `https://terabox-dl.vercel.app/api?url=${encodeURIComponent(teraboxUrl)}`,
    `https://terabox-downloader.vercel.app/api?url=${encodeURIComponent(teraboxUrl)}`,
    `https://terabox-api.vercel.app/api?url=${encodeURIComponent(teraboxUrl)}`,
    `https://terabox-dl-api.vercel.app/api?url=${encodeURIComponent(teraboxUrl)}`
  ];

  for (const api of apis) {
    console.log(`\nTesting API: ${api}`);
    try {
      const res = await axios.get(api, { timeout: 6000 });
      console.log(`  Status: ${res.status}`);
      console.log(`  Keys:`, Object.keys(res.data));
      console.log(`  Data Preview:`, JSON.stringify(res.data).substring(0, 300));
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
    }
  }
}

const url = 'https://www.terabox.app/sharing/link?surl=cpeZCbc0aV73pFUxfgcTtg';
testFreeApis(url).catch(console.error);
