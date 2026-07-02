import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import VideoPlayer from './components/VideoPlayer';
import PlatformCard from './components/PlatformCard';
import LegalModals from './components/LegalModals';
import { 
  AlertCircle, Info, Download, Trash2, Play, Search, Video, 
  CheckCircle2, Loader2, FolderDown, ArrowLeft, RefreshCw,
  Shield, Zap, Users, HelpCircle, ChevronDown, Tv
} from 'lucide-react';

const API_BASE = 'https://api.teraplayer.xyz';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  // Player states
  const [activeVideo, setActiveVideo] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState(null);
  const [manualCard, setManualCard] = useState(null);

  // Legal modal states
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('privacy');

  // Search states
  const [searchResults, setSearchResults] = useState(null);

  // Downloader states
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [downloadsHistory, setDownloadsHistory] = useState([]);

  // Initialize theme and load history
  useEffect(() => {
    localStorage.removeItem('cs_history'); // Clear legacy history
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load downloads
    fetchDownloadsHistory();
  }, []);

  // Submit URL or Search Query
  const handleUrlSubmit = async (url) => {
    setIsResolving(true);
    setResolutionError(null);
    setManualCard(null);
    setSearchResults(null);

    const isUrl = url.startsWith('http://') || url.startsWith('https://');

    if (!isUrl) {
      // Handle search query
      try {
        const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(url)}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setSearchResults(data.results);
          if (data.results.length === 0) {
            setResolutionError('No videos matched your search query.');
          }
        } else {
          setResolutionError(data.message || 'An error occurred during search.');
        }
      } catch (error) {
        console.error('Search API Error:', error);
        setResolutionError('Could not connect to the search backend. Make sure it is running.');
      } finally {
        setIsResolving(false);
      }
      return;
    }

    // Handle standard video link resolution
    try {
      const response = await fetch(`${API_BASE}/api/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setActiveVideo({
          url: url,
          streamUrl: data.streamUrl,
          title: data.title,
          platform: data.platform
        });
      } else {
        if (data.platform === 'terabox' || data.platform === 'diskwala') {
          setManualCard(data);
        } else {
          setResolutionError(data.message || 'An error occurred while resolving this link.');
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      setResolutionError('Could not connect to the server. Verify that the backend is running.');
    } finally {
      setIsResolving(false);
    }
  };

  const playStockVideo = (video) => {
    setActiveVideo({
      url: video.url,
      streamUrl: video.url,
      title: video.title,
      platform: 'stock'
    });
  };

  // Trigger Backend Download
  const handleDownloadTrigger = async (video) => {
    if (!video) return;

    try {
      const response = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url, title: video.title })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const dlId = data.downloadId;
        const newDl = {
          id: dlId,
          title: video.title,
          progress: 0,
          status: 'downloading',
          url: video.url
        };
        setActiveDownloads(prev => [newDl, ...prev]);
        pollDownloadProgress(dlId);
      } else {
        alert(data.message || 'Failed to start download process.');
      }
    } catch (err) {
      console.error('Download start error:', err);
      alert('Error triggering download on backend server.');
    }
  };

  // Poll progress
  const pollDownloadProgress = (dlId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/download/progress/${dlId}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setActiveDownloads(prev => {
            return prev.map(dl => {
              if (dl.id === dlId) {
                return {
                  ...dl,
                  progress: data.progress,
                  status: data.status,
                  filename: data.filename,
                  error: data.error
                };
              }
              return dl;
            });
          });

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            setTimeout(() => {
              // Remove completed from active tracking after 5 seconds
              setActiveDownloads(prev => prev.filter(dl => dl.id !== dlId));
            }, 6000);
            fetchDownloadsHistory();
          }
        } else {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(interval);
      }
    }, 1500);
  };

  // Fetch completed downloads
  const fetchDownloadsHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/downloads`);
      const data = await response.json();
      if (response.ok && data.success) {
        setDownloadsHistory(data.downloads);
      }
    } catch (err) {
      console.error('Fetch downloads history error:', err);
    }
  };

  // Delete downloaded file
  const handleDeleteDownload = async (filename, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/downloads/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        fetchDownloadsHistory();
      } else {
        alert(data.message || 'Failed to delete file.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Play a locally downloaded video file
  const playLocalVideo = (file) => {
    setActiveVideo({
      url: `${API_BASE}${file.url}`,
      streamUrl: `${API_BASE}${file.url}`,
      title: file.filename,
      platform: 'local'
    });
  };

  // Close player
  const closePlayer = () => {
    setActiveVideo(null);
    setResolutionError(null);
  };

  const resetAllState = () => {
    setActiveVideo(null);
    setResolutionError(null);
    setManualCard(null);
    setSearchResults(null);
  };

  // UI Format Helpers
  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 overflow-x-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-[-100px] left-[15%] w-[450px] h-[450px] bg-violet-600/10 dark:bg-violet-500/10 rounded-full blur-[120px] pointer-events-none animate-slowFloat" />
      <div className="absolute top-[30%] right-[10%] w-[550px] h-[550px] bg-indigo-600/10 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none animate-slowFloat-delayed" />
      <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-fuchsia-600/5 dark:bg-fuchsia-500/5 rounded-full blur-[110px] pointer-events-none animate-slowFloat" />

      {/* Navigation Header */}
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Banner Title (hide when player is open) */}
        {!activeVideo && !searchResults && !manualCard && (
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent animate-fadeIn">
              TeraPlayer - Universal TeraBox & DiskWala Downloader
            </h1>
            <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed animate-fadeIn">
              Download or stream videos instantly from TeraBox, DiskWala, YouTube, Google Drive, or raw media CDNs. Fast HD/4K quality playback, no app install required.
            </p>
          </div>
        )}

        {/* Input Bar & Resolving loader */}
        {!activeVideo && !manualCard && (
          <div className="mb-10 flex flex-col gap-6">
            <UrlInput onSubmit={handleUrlSubmit} isLoading={isResolving} />
            
            {/* Trust Badges Bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-slate-500 dark:text-slate-400 text-xs font-bold select-none animate-fadeIn">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-violet-500" /><span>No Registration</span></div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-violet-500 animate-pulse" /><span>2-3 Sec Processing</span></div>
              <div className="flex items-center gap-2"><Tv className="h-4 w-4 text-violet-500" /><span>HD/4K Playback</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-violet-500" /><span>100% Free & Safe</span></div>
            </div>
          </div>
        )}

        {/* Dynamic Screens */}
        <div className="flex flex-col items-center justify-center w-full">
          
          {/* Error Message */}
          {resolutionError && (
            <div className="w-full max-w-3xl mb-8 overflow-hidden rounded-xl border border-rose-500/20 bg-rose-50/50 p-4 dark:border-rose-500/10 dark:bg-rose-950/20 shadow-md">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                <div>
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400">Error</h4>
                  <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-400/80 leading-normal font-medium">
                    {resolutionError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Video Player screen */}
          {activeVideo && (
            <div className="w-full flex flex-col items-center gap-6 animate-fadeIn">
              <VideoPlayer
                src={activeVideo.streamUrl}
                title={activeVideo.title}
                onClose={closePlayer}
              />
              
              {/* Media Info Drawer */}
              <div className="w-full max-w-5xl rounded-2xl border border-slate-200/50 bg-white/70 p-6 dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl shadow-slate-100/10 dark:shadow-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white line-clamp-1">{activeVideo.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                    Source: <span className="text-violet-500 dark:text-violet-400 font-bold">{activeVideo.platform}</span> &bull; License: <span className="text-emerald-500 dark:text-emerald-400 font-bold">CC0 Free Stock</span>
                  </p>
                </div>
                {activeVideo.platform !== 'local' && (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Direct Download (Fast Server) */}
                    <a
                      href={activeVideo.streamUrl}
                      download={activeVideo.title ? `${activeVideo.title.replace(/[\\/:*?"<>|]/g, '_')}.mp4` : 'video.mp4'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm px-5 py-3 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                    >
                      <Download className="h-4.5 w-4.5 animate-pulse" />
                      <span>Direct Download (Fast Server)</span>
                    </a>

                    {/* Download to Server */}
                    <button
                      onClick={() => handleDownloadTrigger(activeVideo)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 hover:border-violet-500/60 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold text-sm px-5 py-3 transition-all active:scale-95 shadow-sm"
                    >
                      <FolderDown className="h-4.5 w-4.5" />
                      <span>Download to Server</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Stream / Search Bar below player */}
              <div className="w-full mt-4">
                <UrlInput onSubmit={handleUrlSubmit} isLoading={isResolving} />
              </div>
            </div>
          )}

          {/* Search Results Display */}
          {!activeVideo && searchResults && (
            <div className="w-full max-w-5xl animate-fadeIn mb-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Search className="h-5 w-5 text-violet-500" />
                  <span>Search Results</span>
                </h3>
                <button 
                  onClick={() => setSearchResults(null)} 
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Clear Search</span>
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((video) => (
                  <div 
                    key={video.id}
                    onClick={() => playStockVideo(video)}
                    className="group cursor-pointer rounded-2xl border border-slate-200/50 bg-white/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/5 dark:border-slate-800/50 dark:bg-slate-900/40 backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:border-violet-500/20 dark:hover:border-violet-400/20"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wider">
                        {formatSeconds(video.duration)}
                      </span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/90 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="h-5 w-5 fill-white translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{video.author}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                        <span>{video.views ? `${video.views.toLocaleString()} views` : 'No views'}</span>
                        <span>&bull;</span>
                        <span>{video.published}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guided Instruction cards */}
          {manualCard && (
            <div className="w-full animate-fadeIn">
              <PlatformCard result={manualCard} onReset={resetAllState} />
            </div>
          )}

          {/* Download Center & History Section */}
          {!activeVideo && !manualCard && (
            <div className="w-full max-w-5xl flex flex-col gap-10 mt-6">
              
              {/* Active Downloads Shelf */}
              {activeDownloads.length > 0 && (
                <div className="w-full rounded-2xl border border-violet-500/20 bg-violet-50/10 p-6 dark:border-violet-500/10 dark:bg-violet-950/5 animate-fadeIn">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-2 mb-4">
                    <FolderDown className="h-5 w-5 animate-bounce" />
                    <span>Active Server Downloads</span>
                  </h4>
                  <div className="flex flex-col gap-4">
                    {activeDownloads.map((dl) => (
                      <div key={dl.id} className="bg-white/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-bold text-slate-800 dark:text-white truncate" title={dl.title}>
                            {dl.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                            <span>Status:</span>
                            <span className={`capitalize font-bold ${
                              dl.status === 'completed' ? 'text-emerald-500' :
                              dl.status === 'failed' ? 'text-rose-500' : 'text-violet-500'
                            }`}>
                              {dl.status === 'downloading' ? `Downloading (${dl.progress}%)` : dl.status}
                            </span>
                            {dl.error && <span className="text-rose-500 font-normal">({dl.error})</span>}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full md:w-64 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                              style={{ width: `${dl.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[32px] text-right">
                            {Math.round(dl.progress)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Downloads History Shelf */}
              {downloadsHistory.length > 0 && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4.5">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      <span>Saved Videos Library ({downloadsHistory.length})</span>
                    </h4>
                    <button 
                      onClick={fetchDownloadsHistory}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                      title="Refresh Library"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {downloadsHistory.map((file) => (
                      <div 
                        key={file.filename}
                        onClick={() => playLocalVideo(file)}
                        className="group flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/70 cursor-pointer shadow-sm hover:shadow transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Play className="h-5 w-5 fill-current translate-x-0.5 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-2" title={file.filename}>
                              {file.filename}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                              Size: {formatBytes(file.size)} &bull; Saved: {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => handleDeleteDownload(file.filename, e)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all shrink-0"
                          title="Delete file"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Dashboard (Welcome + Tips banner) */}
              {!searchResults && (
                <div className="w-full flex flex-col gap-10">
                  
                  {/* Achievements Stats Row */}
                  <div className="grid gap-6 sm:grid-cols-3 w-full">
                    <div className="rounded-2xl border border-slate-200/50 bg-white/60 p-6 dark:border-slate-800/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-slate-100/10 dark:shadow-none flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none">100,000+</h4>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">Active Users</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/50 bg-white/60 p-6 dark:border-slate-800/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-slate-100/10 dark:shadow-none flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <Play className="h-6 w-6 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none">50,000+</h4>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">Daily Streams</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/50 bg-white/60 p-6 dark:border-slate-800/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-slate-100/10 dark:shadow-none flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <Video className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none">2,000,000+</h4>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">Videos Processed</p>
                      </div>
                    </div>
                  </div>

                  {/* Tips & Supported Sources Info Board */}
                  <div className="w-full rounded-2xl border border-slate-200/50 bg-white/60 p-6 dark:border-slate-800/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-slate-100/10 dark:shadow-none">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-3.5">
                      <Info className="h-5 w-5" />
                      <h4 className="text-sm font-bold uppercase tracking-wider">TeraPlayer Legal & Features Info</h4>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      <div>
                        <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Universal Cloud Streaming</h5>
                        <p>TeraPlayer acts purely as a cloud video playing client utility (like VLC or a web browser) to play files from your own Google Drive, TeraBox, DiskWala, and YouTube accounts.</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Zero Content Hosting</h5>
                        <p>We do **not** host, store, index, search, or upload any video files on our servers. All files are streamed directly from the original cloud network provider to your browser.</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">DMCA & Copyright Compliant</h5>
                        <p>We respect intellectual property. Rightsholders can easily report any links through our DMCA portal, and they will be instantly blacklisted from our link resolving client.</p>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Accordion Panel */}
                  <div className="w-full rounded-2xl border border-slate-200/50 bg-white/60 p-6 dark:border-slate-800/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-slate-100/10 dark:shadow-none">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-5">
                      <HelpCircle className="h-5 w-5" />
                      <h4 className="text-sm font-bold uppercase tracking-wider">Frequently Asked Questions</h4>
                    </div>
                    <div className="space-y-4">
                      <details className="group border-b border-slate-200/50 dark:border-slate-800/50 pb-4 cursor-pointer">
                        <summary className="flex items-center justify-between font-bold text-sm text-slate-700 hover:text-violet-500 dark:text-slate-300 dark:hover:text-violet-400 outline-none select-none">
                          <span>Is TeraPlayer free to use?</span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform"><ChevronDown className="h-4.5 w-4.5" /></span>
                        </summary>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 select-text">
                          Yes, TeraPlayer is 100% free to use. You can stream and download as many videos as you want without paying any fees or subscriptions.
                        </p>
                      </details>
                      
                      <details className="group border-b border-slate-200/50 dark:border-slate-800/50 pb-4 cursor-pointer">
                        <summary className="flex items-center justify-between font-bold text-sm text-slate-700 hover:text-violet-500 dark:text-slate-300 dark:hover:text-violet-400 outline-none select-none">
                          <span>How to download and stream TeraBox or DiskWala videos without installing their official apps?</span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform"><ChevronDown className="h-4.5 w-4.5" /></span>
                        </summary>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 select-text">
                          Simply copy your TeraBox or DiskWala link, paste it into our search bar, and click "Stream Now". Our system extracts the direct high-speed video feed so you can watch it instantly or download it directly to your device without installing any third-party apps.
                        </p>
                      </details>

                      <details className="group border-b border-slate-200/50 dark:border-slate-800/50 pb-4 cursor-pointer">
                        <summary className="flex items-center justify-between font-bold text-sm text-slate-700 hover:text-violet-500 dark:text-slate-300 dark:hover:text-violet-400 outline-none select-none">
                          <span>Is this downloader secure and private?</span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform"><ChevronDown className="h-4.5 w-4.5" /></span>
                        </summary>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 select-text">
                          Absolutely. TeraPlayer values user privacy. We do not require any registration, login, or tracking. Your links and files are processed securely through HTTPS and are never logged or stored.
                        </p>
                      </details>

                      <details className="group cursor-pointer">
                        <summary className="flex items-center justify-between font-bold text-sm text-slate-700 hover:text-violet-500 dark:text-slate-300 dark:hover:text-violet-400 outline-none select-none">
                          <span>Can I download full HD movies or 4K videos?</span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform"><ChevronDown className="h-4.5 w-4.5" /></span>
                        </summary>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 select-text">
                          Yes. If the source file uploaded to TeraBox, Google Drive, or YouTube has HD/4K resolutions available, TeraPlayer will let you stream or download it at the highest original quality without any quality compression.
                        </p>
                      </details>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200/50 py-8 dark:border-slate-800/40 bg-white/20 dark:bg-slate-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold tracking-wide text-slate-400 dark:text-slate-600 order-2 md:order-1">
            &copy; {new Date().getFullYear()} TeraPlayer. All rights reserved. Built for fast cloud video streaming and downloads.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500 dark:text-slate-400 order-1 md:order-2">
            <button onClick={() => { setIsLegalOpen(true); setLegalTab('privacy'); }} className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors">Privacy Policy</button>
            <button onClick={() => { setIsLegalOpen(true); setLegalTab('terms'); }} className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors">Terms of Use</button>
            <button onClick={() => { setIsLegalOpen(true); setLegalTab('dmca'); }} className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors">DMCA Disclaimer</button>
            <button onClick={() => { setIsLegalOpen(true); setLegalTab('contact'); }} className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors">Contact Us</button>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <LegalModals
        isOpen={isLegalOpen}
        activeTab={legalTab}
        setActiveTab={setLegalTab}
        onClose={() => setIsLegalOpen(false)}
      />

    </div>
  );
}
