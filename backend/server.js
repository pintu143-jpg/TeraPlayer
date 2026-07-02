const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const axios = require('axios');

const {
  extractGDriveId,
  getGDriveTitle,
  resolveGDrive,
  detectPlatform,
  checkDirectVideoUrl,
  extractYoutubeId,
  getYoutubeTitle,
  resolveViaFlow,
  resolveViaCustomApis
} = require('./utils/resolver');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Setup paths
const binDir = path.join(__dirname, 'bin');
const ytdlpPath = path.join(binDir, 'yt-dlp.exe');
const downloadsDir = path.join(__dirname, 'downloads');

// Ensure directories exist
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Serve completed downloads
app.use('/downloads', express.static(downloadsDir));

// Active downloads map
const activeDownloads = new Map();

// Invidious instances for searching YouTube
const INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://inv.tux.pizza',
  'https://vid.puffyan.us',
  'https://invidious.io.lol',
  'https://invidious.projectsegfaut.im'
];

// 1. Auto-download yt-dlp.exe on startup if missing
function ensureYtdlp() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(ytdlpPath)) {
      console.log(`[Startup] yt-dlp.exe verified at: ${ytdlpPath}`);
      return resolve(ytdlpPath);
    }

    console.log('[Startup] yt-dlp.exe is missing. Downloading from official GitHub release...');
    const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    const tempFile = ytdlpPath + '.tmp';
    const file = fs.createWriteStream(tempFile);

    const download = (downloadUrl) => {
      https.get(downloadUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          download(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download yt-dlp.exe. HTTP Status: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            fs.renameSync(tempFile, ytdlpPath);
            console.log('[Startup] yt-dlp.exe downloaded successfully.');
            resolve(ytdlpPath);
          });
        });
      }).on('error', (err) => {
        fs.unlink(tempFile, () => {});
        reject(err);
      });
    };

    download(url);
  });
}

// Helper to extract YouTube Direct Stream URL
function resolveYoutubeDirectStream(url) {
  return new Promise((resolve, reject) => {
    const args = ['-g', '-f', 'best[ext=mp4]/best', url];
    console.log(`[Resolve] Extracting stream with yt-dlp command: "${ytdlpPath} ${args.join(' ')}"`);
    const child = spawn(ytdlpPath, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        console.warn(`[Resolve] yt-dlp stream extraction failed (code ${code}): ${stderr.trim()}`);
        return reject(new Error('yt-dlp failed to extract stream'));
      }
      resolve(stdout.trim());
    });
  });
}

// Helper for YouTube Searching using Invidious with yt-dlp fallback
async function searchYoutubeInvidious(query) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      console.log(`[Search] Trying Invidious instance: ${url}`);
      const res = await axios.get(url, { timeout: 6000 });
      if (res.data && Array.isArray(res.data)) {
        return res.data.map(item => ({
          id: item.videoId,
          title: item.title,
          thumbnail: item.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
          duration: item.lengthSeconds,
          author: item.author,
          views: item.viewCount || 0,
          published: item.publishedText || 'Recently',
          url: `https://www.youtube.com/watch?v=${item.videoId}`
        }));
      }
    } catch (err) {
      console.warn(`[Search] Invidious instance ${instance} failed: ${err.message}`);
    }
  }
  throw new Error('All Invidious instances failed. Falling back to yt-dlp...');
}

// Fallback search using yt-dlp
function searchYoutubeYtdlp(query) {
  return new Promise((resolve, reject) => {
    const args = [
      `ytsearch10:${query}`,
      '--dump-json',
      '--flat-playlist'
    ];
    console.log(`[Search] Executing yt-dlp search: "${ytdlpPath} ${args.join(' ')}"`);
    const child = spawn(ytdlpPath, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`[Search] yt-dlp search failed (code ${code}): ${stderr.trim()}`);
        return reject(new Error('yt-dlp search failed'));
      }

      try {
        const lines = stdout.trim().split('\n');
        const results = lines.filter(line => line.trim()).map(line => {
          const item = JSON.parse(line);
          return {
            id: item.id,
            title: item.title,
            thumbnail: `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`,
            duration: item.duration || 0,
            author: item.uploader || item.channel || 'Unknown',
            views: item.view_count || 0,
            published: item.upload_date ? `${item.upload_date.slice(0,4)}-${item.upload_date.slice(4,6)}-${item.upload_date.slice(6,8)}` : 'Recently',
            url: `https://www.youtube.com/watch?v=${item.id}`
          };
        });
        resolve(results);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Helper for Pexels Stock Video Search
async function searchPexelsStockVideos(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_FREE_PEXELS_API_KEY' || apiKey.trim() === '') {
    console.log('[Search] PEXELS_API_KEY missing. Loading royalty-free stock mockup videos...');
    
    // Return high-quality public domain clips
    const mockVideos = [
      {
        id: 'mock_1',
        title: 'Big Buck Bunny (CC Animation Stock)',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_Buck_Bunny_Narrator_Screenshot.png/320px-Big_Buck_Bunny_Narrator_Screenshot.png',
        duration: 596,
        author: 'Blender Open Source',
        views: 3450,
        published: 'CC Stock License',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      },
      {
        id: 'mock_2',
        title: 'Elephants Dream (Sci-Fi CGI Stock)',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Elephants_Dream_s4_proog.jpg/320px-Elephants_Dream_s4_proog.jpg',
        duration: 653,
        author: 'Orange Open Project',
        views: 1204,
        published: 'CC Stock License',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      },
      {
        id: 'mock_3',
        title: 'Nature Drone Stock (Forest Landscape)',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=320',
        duration: 15,
        author: 'Google Media Services',
        views: 8932,
        published: 'Free CC0 Stock',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      },
      {
        id: 'mock_4',
        title: 'Tears of Steel (VFX CGI Footage)',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Tears_of_Steel_promo_poster.jpg/320px-Tears_of_Steel_promo_poster.jpg',
        duration: 734,
        author: 'Blender VFX Lab',
        views: 5690,
        published: 'CC Stock License',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
      },
      {
        id: 'mock_5',
        title: 'Sintel Trailer (Fantasy CGI Footage)',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/320px-Sintel_poster.jpg',
        duration: 52,
        author: 'Durian CGI Team',
        views: 4509,
        published: 'CC Stock License',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
      }
    ];

    if (!query || query.toLowerCase() === 'all' || query.toLowerCase() === 'stock') {
      return mockVideos;
    }
    return mockVideos.filter(v => v.title.toLowerCase().includes(query.toLowerCase()));
  }

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15`;
  console.log(`[Search] Querying Pexels API: ${url}`);
  const res = await axios.get(url, {
    headers: { 'Authorization': apiKey },
    timeout: 8000
  });

  if (res.data && Array.isArray(res.data.videos)) {
    return res.data.videos.map(video => {
      // Sort video files by total resolution descending to default to the highest quality (e.g. 4K, 1080p HD)
      const sortedFiles = [...video.video_files].sort((a, b) => {
        const resA = (a.width || 0) * (a.height || 0);
        const resB = (b.width || 0) * (b.height || 0);
        return resB - resA;
      });
      const file = sortedFiles[0] || video.video_files[0];
      const selectedWidth = file.width || video.width;
      const selectedHeight = file.height || video.height;

      return {
        id: video.id.toString(),
        title: `Stock Clip: ${query.charAt(0).toUpperCase() + query.slice(1)} (${selectedWidth}x${selectedHeight})`,
        thumbnail: video.image,
        duration: video.duration,
        author: video.user.name,
        views: (video.id % 4000) + 120,
        published: 'Free Stock License (CC0)',
        url: file.link
      };
    });
  }
  
  return [];
}

// API: Search Endpoint
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, message: 'Search query (q) is required' });
  }

  try {
    const results = await searchPexelsStockVideos(q);
    return res.json({ success: true, source: process.env.PEXELS_API_KEY ? 'pexels' : 'mockup', results });
  } catch (err) {
    console.error('[Search] Pexels stock video search failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not fetch stock videos. Pexels API failed.',
      error: err.message
    });
  }
});

// API: Resolve Video URLs
app.post('/api/resolve', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  try {
    const platform = detectPlatform(url);

    if (platform === 'gdrive') {
      const fileId = extractGDriveId(url);
      if (!fileId) {
        return res.status(400).json({ 
          success: false, 
          platform: 'gdrive',
          message: 'Invalid Google Drive link format. Could not extract file ID.' 
        });
      }

      console.log(`Resolving Google Drive File ID: ${fileId}`);
      const [streamUrl, title] = await Promise.all([
        resolveGDrive(fileId),
        getGDriveTitle(fileId)
      ]);

      return res.json({
        success: true,
        platform: 'gdrive',
        streamUrl,
        title,
        fileId
      });
    }

    if (platform === 'terabox') {
      console.log(`Attempting custom API resolution for TeraBox: ${url}`);
      const customRes = await resolveViaCustomApis(url, 'terabox');
      if (customRes.success) {
        console.log(`Successfully resolved TeraBox via custom API: ${customRes.title}`);
        return res.json({
          success: true,
          platform: 'terabox',
          streamUrl: customRes.streamUrl,
          title: customRes.title,
          thumbnail: customRes.thumbnail
        });
      }

      console.log(`Custom TeraBox API failed (${customRes.error || 'unknown error'}). Attempting automated fallback resolution: ${url}`);
      const flowRes = await resolveViaFlow(url);
      
      if (flowRes.success) {
        console.log(`Successfully resolved TeraBox via fallback: ${flowRes.title}`);
        return res.json({
          success: true,
          platform: 'terabox',
          streamUrl: flowRes.streamUrl,
          title: flowRes.title,
          thumbnail: flowRes.thumbnail,
          size: flowRes.size
        });
      }

      if (customRes.error && (customRes.error.includes('permissions') || customRes.error.includes('approve'))) {
        return res.json({
          success: false,
          platform: 'terabox',
          message: `Your custom TeraBox Apify API is configured, but requires permission approval:`,
          helpTitle: 'TeraBox API Permission Setup Required',
          helpSteps: [
            'Click the link to approve permissions: https://console.apify.com/actors/A5crpuk9MB019Qf1r?approvePermissions=true',
            'Log into your Apify account if requested.',
            'Confirm/Approve the required permissions for the actor.',
            'Once approved, paste the TeraBox link here again to stream.'
          ]
        });
      }

      console.log(`Automated TeraBox fallback resolution failed: ${flowRes.message}. Falling back to manual instructions.`);
      return res.json({
        success: false,
        platform: 'terabox',
        message: 'TeraBox links require authentication. Automated resolution failed. Please follow the instructions to stream manually:',
        helpTitle: 'TeraBox Streaming Guide',
        helpSteps: [
          'Log in to your TeraBox account in a browser.',
          'Open the shared video page and open Developer Tools (F12).',
          'Go to the Network tab and filter by "media" or "m3u8".',
          'Refresh the page, play the video, and copy the direct streaming URL.',
          'Paste that copied direct URL back into CloudStream to play with custom controls.'
        ]
      });
    }

    if (platform === 'diskwala') {
      console.log(`Attempting custom API resolution for DiskWala: ${url}`);
      const customRes = await resolveViaCustomApis(url, 'diskwala');
      if (customRes.success) {
        console.log(`Successfully resolved DiskWala via custom API: ${customRes.title}`);
        return res.json({
          success: true,
          platform: 'diskwala',
          streamUrl: customRes.streamUrl,
          title: customRes.title
        });
      }

      console.log(`Custom DiskWala API failed (${customRes.error || 'unknown error'}). Attempting automated fallback resolution: ${url}`);
      const flowRes = await resolveViaFlow(url);

      if (flowRes.success) {
        console.log(`Successfully resolved DiskWala via fallback: ${flowRes.title}`);
        return res.json({
          success: true,
          platform: 'diskwala',
          streamUrl: flowRes.streamUrl,
          title: flowRes.title,
          thumbnail: flowRes.thumbnail,
          size: flowRes.size
        });
      }

      if (customRes.error && (customRes.error.includes('backend API key') || customRes.error.includes('Invalid token'))) {
        return res.json({
          success: false,
          platform: 'diskwala',
          message: `Your custom DiskWala API token is valid, but the API returned: "${customRes.error}".`,
          helpTitle: 'DiskWala Custom API Key Configuration Error',
          helpSteps: [
            'Log into your diskwala.litedns.xyz account/dashboard.',
            'Ensure you have assigned/configured your DiskWala developer API key (or session keys) inside your litedns panel.',
            'Make sure your token is active and has credits/usage allowed.',
            'Try pasting the DiskWala link here again once setup is complete.'
          ]
        });
      }

      console.log(`Automated DiskWala fallback resolution failed: ${flowRes.message}. Falling back to manual instructions.`);
      return res.json({
        success: false,
        platform: 'diskwala',
        message: 'DiskWala requires ad-views and creator support. Automated resolution failed. Please follow these steps to play:',
        helpTitle: 'DiskWala Streaming Guide',
        helpSteps: [
          'Open the DiskWala link in a new browser tab.',
          'Solve any captchas or view the required page to load their player.',
          'Inspect the page or use a network sniffer to find the underlying MP4 or stream URL.',
          'Paste the resolved direct link here.'
        ]
      });
    }

    if (platform === 'youtube') {
      const videoId = extractYoutubeId(url);
      if (!videoId) {
        return res.status(400).json({ 
          success: false, 
          platform: 'youtube',
          message: 'Invalid YouTube URL format. Could not extract video ID.' 
        });
      }

      console.log(`Resolving YouTube Video ID: ${videoId}`);
      const title = await getYoutubeTitle(videoId);

      try {
        console.log(`Attempting to extract direct YouTube stream URL for ${url}`);
        const streamUrl = await resolveYoutubeDirectStream(url);
        return res.json({
          success: true,
          platform: 'youtube',
          streamUrl: streamUrl,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          title,
          videoId
        });
      } catch (err) {
        console.log(`Direct stream extraction failed, falling back to iframe embed`);
        return res.json({
          success: true,
          platform: 'youtube',
          streamUrl: `https://www.youtube.com/embed/${videoId}`,
          isEmbed: true,
          title,
          videoId
        });
      }
    }

    // Default: Check direct video URL
    const { isDirect, contentType } = await checkDirectVideoUrl(url);
    if (isDirect) {
      const fileName = url.split('/').pop().split('?')[0] || 'Direct Stream';
      return res.json({
        success: true,
        platform: 'direct',
        streamUrl: url,
        title: decodeURIComponent(fileName),
        contentType
      });
    }

    return res.status(400).json({
      success: false,
      platform: 'unknown',
      message: 'CloudStream could not identify a valid video source from this URL. Verify it is a direct video link (MP4, WebM, HLS/M3U8) or a supported platform link.'
    });

  } catch (err) {
    console.error('Error resolving URL:', err.message);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while resolving the video URL.',
      error: err.message
    });
  }
});

// API: Download Video File (using yt-dlp)
app.post('/api/download', async (req, res) => {
  const { url, title } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  const downloadId = 'dl_' + Date.now();
  const safeTitle = (title || 'Video').replace(/[\\/:*?"<>|]/g, '_');
  const outputPattern = path.join(downloadsDir, `${safeTitle}-%(id)s.%(ext)s`);

  console.log(`[Download] Starting background download for ID ${downloadId}: ${url}`);

  const downloadInfo = {
    id: downloadId,
    title: title || 'Video',
    url,
    progress: 0,
    status: 'downloading',
    filename: `${safeTitle}.mp4`, // default fallback name
    error: null,
    startedAt: new Date()
  };
  activeDownloads.set(downloadId, downloadInfo);

  // Spawn yt-dlp to download best single-file MP4 format (avoiding ffmpeg merges for speed and compatibility)
  const args = [
    '-f', 'best[ext=mp4]/best',
    '-o', outputPattern,
    url
  ];

  const child = spawn(ytdlpPath, args);

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      // Parse download progress percentages
      const progressMatch = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
      if (progressMatch) {
        downloadInfo.progress = parseFloat(progressMatch[1]);
      }

      // Parse output filepath
      const destMatch = line.match(/Destination:\s*(.*)/) || line.match(/Merging formats into\s*"(.*)"/);
      if (destMatch && destMatch[1]) {
        downloadInfo.filename = path.basename(destMatch[1].trim());
      }

      // Parse already downloaded file condition
      if (line.includes('has already been downloaded')) {
        downloadInfo.progress = 100;
        downloadInfo.status = 'completed';
        const fileMatch = line.match(/(downloads[\\/][^ ]+)/) || line.match(/([^\\]+\.mp4)/);
        if (fileMatch) {
          downloadInfo.filename = path.basename(fileMatch[1].trim());
        }
      }
    }
  });

  child.stderr.on('data', (data) => {
    console.error(`[Download Error Output] ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    if (code === 0) {
      downloadInfo.progress = 100;
      downloadInfo.status = 'completed';
      console.log(`[Download] Download completed successfully: ${downloadInfo.filename}`);
    } else {
      downloadInfo.status = 'failed';
      downloadInfo.error = `yt-dlp process exited with code ${code}`;
      console.error(`[Download] Download failed: ${downloadInfo.error}`);
    }
  });

  return res.json({
    success: true,
    downloadId,
    message: 'Download started successfully.'
  });
});

// API: Check Download Progress
app.get('/api/download/progress/:id', (req, res) => {
  const { id } = req.params;
  const info = activeDownloads.get(id);
  if (!info) {
    return res.status(404).json({ success: false, message: 'Download tracker not found.' });
  }
  return res.json({
    success: true,
    ...info
  });
});

// API: List Downloaded Files
app.get('/api/downloads', (req, res) => {
  try {
    const files = fs.readdirSync(downloadsDir);
    const downloadedList = files.map(file => {
      const filePath = path.join(downloadsDir, file);
      const stat = fs.statSync(filePath);
      return {
        filename: file,
        size: stat.size,
        createdAt: stat.birthtime,
        url: `/downloads/${encodeURIComponent(file)}`
      };
    }).sort((a, b) => b.createdAt - a.createdAt);

    return res.json({ success: true, downloads: downloadedList });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Delete Downloaded File
app.delete('/api/downloads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(downloadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on disk.' });
  }

  try {
    fs.unlinkSync(filePath);
    console.log(`[Delete] Deleted file: ${filename}`);
    return res.json({ success: true, message: 'File deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Initialize server after verifying/installing yt-dlp
ensureYtdlp()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Startup] CloudStream Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Startup] Failed to start server due to yt-dlp check failure:', err.message);
    // Start server anyway as a fallback
    app.listen(PORT, () => {
      console.log(`[Startup] CloudStream Server running on port ${PORT} (WITHOUT yt-dlp downloader)`);
    });
  });
