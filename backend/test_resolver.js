const { detectPlatform, extractGDriveId, checkDirectVideoUrl } = require('./utils/resolver');

async function runTests() {
  console.log('--- Platform Detection Tests ---');
  const platforms = [
    { url: 'https://drive.google.com/file/d/1A_B_C-D_E/view?usp=sharing', expected: 'gdrive' },
    { url: 'https://teraboxapp.com/s/1xyz987', expected: 'terabox' },
    { url: 'https://thediskwala.com/stream/file123', expected: 'diskwala' },
    { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', expected: 'unknown' }
  ];

  for (const t of platforms) {
    const p = detectPlatform(t.url);
    console.log(`URL: ${t.url}\n  Detected: ${p} (Expected: ${t.expected})`);
    if (p === 'gdrive') {
      console.log(`  Extracted GDrive ID: ${extractGDriveId(t.url)}`);
    }
  }

  console.log('\n--- Direct Video Link Tests ---');
  const directUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const res = await checkDirectVideoUrl(directUrl);
  console.log(`URL: ${directUrl}\n  IsDirect: ${res.isDirect}, ContentType: ${res.contentType}`);
}

runTests().catch(console.error);
