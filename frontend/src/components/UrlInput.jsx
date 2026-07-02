import React, { useState, useEffect } from 'react';
import { Play, Link2, CheckCircle2, AlertTriangle, FileVideo, Search, Loader2, Clipboard } from 'lucide-react';

export default function UrlInput({ onSubmit, isLoading, currentUrl }) {
  const [query, setQuery] = useState(currentUrl || '');
  const [platform, setPlatform] = useState('');

  // Detect platform automatically as user types/pastes
  useEffect(() => {
    if (!query) {
      setPlatform('');
      return;
    }

    const lower = query.toLowerCase();
    if (lower.includes('drive.google.com') || lower.includes('docs.google.com/file')) {
      setPlatform('gdrive');
    } else if (
      lower.includes('terabox') || 
      lower.includes('nephobox') || 
      lower.includes('dubox') || 
      lower.includes('1024tera') || 
      lower.includes('momofiles') || 
      lower.includes('4shared') ||
      lower.includes('tibabox')
    ) {
      setPlatform('terabox');
    } else if (lower.includes('diskwala')) {
      setPlatform('diskwala');
    } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setPlatform('youtube');
    } else if (
      lower.startsWith('http://') || 
      lower.startsWith('https://')
    ) {
      // Check for direct video extensions
      const ext = lower.split('?')[0].split('.').pop();
      if (['mp4', 'webm', 'ogg', 'm3u8', 'mpd'].includes(ext)) {
        setPlatform('direct');
      } else {
        setPlatform('web');
      }
    } else if (query.trim().length > 0) {
      setPlatform('search');
    } else {
      setPlatform('');
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSubmit(query.trim());
    setQuery('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuery(text);
      }
    } catch (err) {
      console.warn('Failed to read clipboard text:', err);
    }
  };

  const getBadgeConfig = () => {
    switch (platform) {
      case 'gdrive':
        return { label: 'Google Drive Link', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'terabox':
        return { label: 'TeraBox Link', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'diskwala':
        return { label: 'DiskWala Link', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'youtube':
        return { label: 'YouTube Stream', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      case 'direct':
        return { label: 'Direct Video URL', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'web':
        return { label: 'Generic Web Link', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
      case 'search':
        return { label: 'Free Stock Search', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' };
      default:
        return null;
    }
  };

  const badge = getBadgeConfig();

  return (
    <div className="w-full max-w-3xl mx-auto animate-fadeIn">
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {platform === 'search' ? (
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            ) : (
              <Link2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            )}
          </div>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-md pl-10 pr-12 py-3.5 text-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 focus:shadow-[0_0_20px_rgba(139,92,246,0.12)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-violet-400 dark:focus:shadow-[0_0_25px_rgba(139,92,246,0.2)]"
            placeholder="Paste video URL (YouTube, TeraBox, GDrive, Direct Link) or search free stock..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            onClick={handlePaste}
            className="absolute inset-y-0 right-3 flex items-center px-1 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors pointer-events-auto"
            title="Paste from clipboard"
          >
            <Clipboard className="h-4.5 w-4.5" />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-500 to-indigo-600 px-7 py-3.5 text-sm font-extrabold text-white transition-all duration-300 hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/20 active:scale-95 border border-violet-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{platform === 'search' ? 'Searching...' : 'Analyzing...'}</span>
            </>
          ) : (
            <>
              {platform === 'search' ? <Search className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              <span>{platform === 'search' ? 'Search' : 'Stream Now'}</span>
            </>
          )}
        </button>
      </form>

      {/* Platform Badge Indicator */}
      {badge && (
        <div className="mt-2.5 flex items-center gap-1.5 animate-fadeIn">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
            {platform === 'gdrive' && <CheckCircle2 className="h-3 w-3" />}
            {['terabox', 'diskwala'].includes(platform) && <AlertTriangle className="h-3 w-3" />}
            {platform === 'direct' && <FileVideo className="h-3 w-3" />}
            {platform === 'search' && <Search className="h-3 w-3" />}
            {badge.label}
          </span>
        </div>
      )}
    </div>
  );
}
