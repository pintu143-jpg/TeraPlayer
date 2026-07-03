const axios = require('axios');

function extractGDriveId(url) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function extractDiskwalaId(url) {
  const match = url.match(/\/app\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function getGDriveTitle(fileId) {
  try {
    const url = `https://drive.google.com/file/d/${fileId}/view`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });
    const match = response.data.match(/<title>(.*?) - Google Drive<\/title>/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return 'Google Drive Video';
  } catch (e) {
    return 'Google Drive Video';
  }
}

async function resolveGDrive(fileId) {
  const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    const response = await axios.get(url, {
      headers,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });

    if (response.status === 302 || response.status === 301) {
      return response.headers.location;
    }

    const html = response.data;
    const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/);
    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      const confirmUrl = `https://docs.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
      
      const confirmResponse = await axios.get(confirmUrl, {
        headers,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });

      if (confirmResponse.status === 302 || confirmResponse.status === 301) {
        return confirmResponse.headers.location;
      }
    }
    
    return url; // fallback
  } catch (error) {
    if (error.response && (error.response.status === 302 || error.response.status === 301)) {
      return error.response.headers.location;
    }
    return url;
  }
}

function detectPlatform(url) {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com/file')) {
    return 'gdrive';
  }
  
  if (
    lowerUrl.includes('terabox') || 
    lowerUrl.includes('nephobox') || 
    lowerUrl.includes('dubox') || 
    lowerUrl.includes('1024tera') || 
    lowerUrl.includes('momofiles') || 
    lowerUrl.includes('4shared') ||
    lowerUrl.includes('tibabox')
  ) {
    return 'terabox';
  }
  
  if (lowerUrl.includes('diskwala')) {
    return 'diskwala';
  }

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  return 'unknown';
}

function extractYoutubeId(url) {
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function getYoutubeTitle(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });
    const match = response.data.match(/<title>(.*?)<\/title>/i);
    if (match && match[1]) {
      return match[1].replace(' - YouTube', '').trim();
    }
    return 'YouTube Video';
  } catch (e) {
    return 'YouTube Video';
  }
}

async function checkDirectVideoUrl(url) {
  try {
    const response = await axios.head(url, { 
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const contentType = response.headers['content-type'] || '';
    if (contentType.startsWith('video/') || contentType.includes('mpegurl') || contentType.includes('application/dash+xml')) {
      return { isDirect: true, contentType };
    }
  } catch (e) {
    // If HEAD fails, attempt regex
  }
  
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  if (['mp4', 'webm', 'ogg', 'm3u8', 'mpd'].includes(ext)) {
    return { isDirect: true, contentType: `video/${ext}` };
  }
  
  return { isDirect: false };
}

async function resolveViaCustomApis(url, platform) {
  if (platform === 'terabox' && process.env.TERABOX_API_URL) {
    try {
      console.log('Attempting custom TeraBox Apify resolver...');
      const response = await axios.post(process.env.TERABOX_API_URL, {
        url: url
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });

      const data = response.data;
      const item = Array.isArray(data) ? data[0] : data;
      
      const streamUrl = item.fast_stream_url || item.streamUrl || item.video_url || item.url || item.downloadLink || item.download;
      const title = item.file_name || item.title || 'TeraBox Video';
      const thumbnail = item.thumbnail || item.thumb;

      if (streamUrl) {
        return {
          success: true,
          streamUrl,
          title,
          thumbnail
        };
      }
    } catch (e) {
      console.warn('Custom TeraBox API failed:', e.message);
      if (e.response && e.response.data && e.response.data.error) {
        const errMsg = typeof e.response.data.error === 'object' 
          ? e.response.data.error.message 
          : e.response.data.error;
        return { success: false, error: errMsg };
      }
      return { success: false, error: e.message };
    }
  }

  if (platform === 'diskwala') {
    try {
      let token = process.env.DISKWALA_TOKEN;
      if (!token && process.env.DISKWALA_API_URL) {
        const match = process.env.DISKWALA_API_URL.match(/token=([a-zA-Z0-9_-]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return { success: false, error: 'No DiskWala API token configured in environment.' };
      }

      console.log('Attempting custom DiskWala API resolver at thediskwala.com...');
      const targetUrl = `https://thediskwala.com/api/diskwala?url=${encodeURIComponent(url)}`;
      const response = await axios.get(targetUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000
      });
      
      const data = response.data;
      const streamUrl = data.video_url || data.streamUrl || data.stream_url || data.url || data.download || data.download_link;
      const title = data.title || data.file_name || 'DiskWala Video';

      if (streamUrl) {
        return {
          success: true,
          streamUrl,
          title
        };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    } catch (e) {
      console.warn('Custom DiskWala API failed:', e.message);
      if (e.response && e.response.data && e.response.data.error) {
        return { success: false, error: e.response.data.error };
      }
      return { success: false, error: e.message };
    }
  }

  return { success: false };
}

async function resolveViaFlow(videoUrl) {
  try {
    const isDiskwala = videoUrl.toLowerCase().includes('diskwala');
    const targetHost = isDiskwala 
      ? 'https://diskwaladownloader.flowvideoplayer.com'
      : 'https://flowvideoplayer.com';
    const apiPath = isDiskwala
      ? '/searchVideo'
      : '/telegram/bot/search/video';

    const homepageRes = await axios.get(targetHost, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const csrfMatch = homepageRes.data.match(/<meta name="csrf-token" content="(.*?)"/);
    if (!csrfMatch) {
      throw new Error('CSRF token not found');
    }
    const csrfToken = csrfMatch[1];
    const setCookie = homepageRes.headers['set-cookie'] || [];
    const cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');

    const apiRes = await axios.post(`${targetHost}${apiPath}`, {
      url: videoUrl
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookieHeader,
        'Referer': `${targetHost}/`,
        'Origin': targetHost
      },
      timeout: 25000
    });

    if (isDiskwala) {
      if (apiRes.data && apiRes.data.status && apiRes.data.response && apiRes.data.response.length > 0) {
        const fileData = apiRes.data.response[0];
        // Extract the R2 bucket origin from the thumbnail
        let streamUrl = '';
        if (fileData.thumbnail) {
          try {
            const u = new URL(fileData.thumbnail);
            streamUrl = `${u.protocol}//${u.host}/${fileData.file_name}`;
          } catch (e) {
            console.error('Failed to parse thumbnail URL for DiskWala:', e.message);
          }
        }
        return {
          success: true,
          streamUrl: streamUrl,
          title: fileData.file_name,
          thumbnail: fileData.thumbnail,
          size: fileData.file_size
        };
      }
    } else {
      if (apiRes.data && apiRes.data.status && apiRes.data.response && apiRes.data.response.length > 0) {
        const fileData = apiRes.data.response[0];
        return {
          success: true,
          streamUrl: fileData.fast_stream_url,
          title: fileData.file_name,
          thumbnail: fileData.thumbnail,
          size: fileData.file_size
        };
      }
    }

    return {
      success: false,
      message: apiRes.data ? apiRes.data.message : 'No response from scraper.'
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}

module.exports = {
  extractGDriveId,
  extractDiskwalaId,
  getGDriveTitle,
  resolveGDrive,
  detectPlatform,
  checkDirectVideoUrl,
  extractYoutubeId,
  getYoutubeTitle,
  resolveViaFlow,
  resolveViaCustomApis
};
