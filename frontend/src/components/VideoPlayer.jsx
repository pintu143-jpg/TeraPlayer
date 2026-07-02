import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Volume1,
  Maximize, Minimize, Settings, Download, Tv, Loader2, ArrowLeft,
  Sliders, HelpCircle, Keyboard, X
} from 'lucide-react';

export default function VideoPlayer({ 
  src, 
  title, 
  onClose, 
  initialTime = 0, 
  onProgress 
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const clickTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);

  const hlsRef = useRef(null);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // New interactive states for perfect media player
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [centerFeedback, setCenterFeedback] = useState({ visible: false, type: null });
  const [skipIndicator, setSkipIndicator] = useState({ visible: false, type: 'forward' });

  const triggerCenterFeedback = (iconType) => {
    setCenterFeedback({ visible: true, type: iconType });
    setTimeout(() => {
      setCenterFeedback(prev => prev.type === iconType ? { visible: false, type: null } : prev);
    }, 600);
  };

  const triggerSkipIndicator = (type) => {
    setSkipIndicator({ visible: true, type });
    setTimeout(() => {
      setSkipIndicator(prev => prev.type === type ? { visible: false, type } : prev);
    }, 700);
  };

  const changeQuality = (index) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
    }
    setShowQualityMenu(false);
  };

  // Initialize and handle HLS / Direct source loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setIsPlaying(false);
    let hls = null;

    // Detect if source is HLS (M3U8)
    const isHlsSource = 
      src.toLowerCase().includes('m3u8') || 
      src.includes('application/x-mpegURL') ||
      src.toLowerCase().includes('get_m3u8') ||
      src.toLowerCase().includes('stream_fast') ||
      src.toLowerCase().includes('.m3u');

    if (isHlsSource) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 90, // Target up to 90s maximum buffer ahead
          maxBufferLength: 45,    // Keep 45s of buffer under normal conditions
          maxBufferSize: 200 * 1024 * 1024, // 200MB buffer limit for high bitrate streams
          maxBufferHole: 2.0,     // Jump over gaps in stream segments up to 2.0s
          nudgeMaxRetry: 10,      // Try nudging up to 10 times to bypass stalling
          nudgeOffset: 0.2,       // Nudge by 0.2s if stuck
          enableWorker: true,     // Parse segments in background worker threads
          lowBufferWatchdogLimit: 1.5, // Force seek if stuck in low buffer
          abrBandWidthFactor: 0.75, // Conservative quality switching to avoid buffering
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setQualities(hls.levels || []);
          setCurrentQuality(hls.currentLevel);
          if (initialTime > 0) {
            video.currentTime = initialTime;
          }
          video.play().catch(err => {
            console.warn('Autoplay blocked on manifest parsed:', err);
          });
        });
        hls.on(Hls.Events.LEVELS_UPDATED, (event, data) => {
          if (data && data.levels) {
            setQualities(data.levels);
          }
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.warn('HLS.js error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        video.src = src;
        setIsLoading(false);
      } else {
        // Fallback for non-supported HLS
        video.src = src;
        setIsLoading(false);
      }
    } else {
      // Direct MP4 / WebM
      video.src = src;
      video.load();
      setIsLoading(false);
    }

    // Attempt to autoplay if a valid src is present
    const handleCanPlay = () => {
      setIsLoading(false);
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
      video.play().catch(err => {
        console.warn('Autoplay blocked on canplay:', err);
      });
    };

    video.addEventListener('canplay', handleCanPlay);

    return () => {
      if (hls) {
        hls.destroy();
      }
      hlsRef.current = null;
      setQualities([]);
      setCurrentQuality(-1);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [src]);

  // Handle keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keybinds if the user is typing in inputs
      if (document.activeElement.tagName === 'INPUT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(volume - 0.1, 0));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyP':
          e.preventDefault();
          togglePiP();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted]);

  // Sync state on fullscreen changes (esc key or browser buttons)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls Visibility Timer (mouse movement detection)
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      triggerCenterFeedback('pause');
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        triggerCenterFeedback('play');
      }).catch(err => {
        console.warn('Playback failed:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (onProgress) {
      onProgress(video.currentTime);
    }
  };

  const handleDurationChange = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || duration === 0) return;
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const changeVolume = (newVal) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVal;
    setVolume(newVal);
    setIsMuted(newVal === 0);
    triggerCenterFeedback(newVal === 0 ? 'mute' : 'volume');
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    triggerCenterFeedback(nextMuted ? 'mute' : 'unmute');
  };

  const changeSpeed = (rate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video || document.pictureInPictureElement === undefined) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.error('Picture-in-Picture error:', err);
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const handleVideoWaiting = () => setIsLoading(true);
  const handleVideoPlaying = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };

  const isYoutube = src && src.includes('youtube.com/embed');

  if (isYoutube) {
    return (
      <div className="relative flex aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl border border-slate-800">
        <iframe
          src={`${src}?autoplay=1`}
          title={title || "YouTube video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full object-contain"
        />
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-black/30 text-white hover:bg-black/50 transition-all"
              title="Back"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white line-clamp-1 drop-shadow-md">
                {title || 'YouTube Video'}
              </span>
              <span className="text-[10px] text-slate-300 font-medium tracking-wide drop-shadow-sm uppercase">
                Now Streaming (YouTube)
              </span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-white/50 tracking-wider bg-black/45 px-2.5 py-1 rounded-full border border-white/5 uppercase pointer-events-auto">
            Using Native Controls
          </div>
        </div>
      </div>
    );
  }

  const handleVideoClick = (e) => {
    const currentTimeVal = Date.now();
    const timeDiff = currentTimeVal - lastClickTimeRef.current;
    lastClickTimeRef.current = currentTimeVal;

    if (timeDiff < 300) {
      // Double click!
      clearTimeout(clickTimeoutRef.current);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const relativeX = x / rect.width;

      if (relativeX < 0.4) {
        skip(-10);
        triggerSkipIndicator('backward');
      } else if (relativeX > 0.6) {
        skip(10);
        triggerSkipIndicator('forward');
      } else {
        toggleFullscreen();
      }
    } else {
      // Single click - wait a bit to check for double click
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay();
      }, 300);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative flex aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl select-none group border border-slate-800"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onWaiting={handleVideoWaiting}
        onPlaying={handleVideoPlaying}
        onPause={() => setIsPlaying(false)}
        className="h-full w-full object-contain cursor-pointer"
        playsInline
      />

      {/* Loading Spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        </div>
      )}

      {/* Custom Controls UI Overlay */}
      <div 
        className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/50 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar (Title & Close) */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-black/30 text-white hover:bg-black/50 transition-all"
              title="Back"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white line-clamp-1 drop-shadow-md">
                {title || 'Cloud Video'}
              </span>
              <span className="text-[10px] text-slate-300 font-medium tracking-wide drop-shadow-sm uppercase">
                Now Streaming
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="p-2 rounded-lg bg-black/30 text-white hover:bg-black/50 transition-all pointer-events-auto"
              title="Keyboard Shortcuts"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>
            <div className="text-[11px] font-bold text-white/40 tracking-wider bg-black/25 px-2.5 py-1 rounded-full border border-white/5 uppercase pointer-events-auto">
              1080p stream
            </div>
          </div>
        </div>

        {/* Center Play Button Overlay (Show briefly when paused) */}
        {!isPlaying && !isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600/95 text-white hover:bg-violet-700 hover:scale-110 shadow-lg shadow-violet-500/30 transition-all duration-300"
            >
              <Play className="h-7 w-7 fill-white translate-x-0.5" />
            </button>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="w-full flex flex-col gap-3">
          
          {/* Progress Seek Slider */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-xs font-semibold text-slate-200 min-w-[42px] text-right">
              {formatTime(currentTime)}
            </span>
            
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/20 accent-violet-500 hover:accent-violet-400 focus:outline-none transition-all"
              style={{
                background: `linear-gradient(to right, rgb(139, 92, 246) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.2) ${duration ? (currentTime / duration) * 100 : 0}%)`
              }}
            />

            <span className="text-xs font-semibold text-slate-200 min-w-[42px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Buttons Panel */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-violet-400 hover:scale-110 transition-all"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
              </button>

              {/* Backward 10s */}
              <button
                onClick={() => skip(-10)}
                className="text-white hover:text-violet-400 hover:scale-110 transition-all"
                title="Backward 10s (←)"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => skip(10)}
                className="text-white hover:text-violet-400 hover:scale-110 transition-all"
                title="Forward 10s (→)"
              >
                <RotateCw className="h-5 w-5" />
              </button>

              {/* Volume Controller */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-violet-400 transition-all"
                  title="Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-0 overflow-hidden group-hover/volume:w-16 h-1 appearance-none bg-white/20 rounded accent-white transition-all duration-300 focus:outline-none"
                />
              </div>

            </div>

            {/* Right Side Options */}
            <div className="flex items-center gap-4 relative">
              
              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-white hover:text-violet-400 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 transition-all"
                  title="Playback Speed"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-24 overflow-hidden rounded-xl border border-white/10 bg-black/90 backdrop-blur-md p-1 shadow-2xl">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changeSpeed(rate)}
                        className={`w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold hover:bg-white/15 transition-colors ${
                          playbackRate === rate ? 'text-violet-400' : 'text-white'
                        }`}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Selector */}
              {!isYoutube && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowSpeedMenu(false);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-white hover:text-violet-400 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 transition-all"
                    title="Video Quality"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>
                      {qualities.length > 0
                        ? (currentQuality === -1 ? 'Auto' : `${qualities[currentQuality]?.height || 'HD'}p`)
                        : 'Source'}
                    </span>
                  </button>

                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-28 overflow-hidden rounded-xl border border-white/10 bg-black/90 backdrop-blur-md p-1 shadow-2xl z-50">
                      {qualities.length > 0 ? (
                        <>
                          <button
                            onClick={() => changeQuality(-1)}
                            className={`w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold hover:bg-white/15 transition-colors ${
                              currentQuality === -1 ? 'text-violet-400' : 'text-white'
                            }`}
                          >
                            Auto
                          </button>
                          {qualities.map((level, idx) => (
                            <button
                              key={idx}
                              onClick={() => changeQuality(idx)}
                              className={`w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold hover:bg-white/15 transition-colors ${
                                currentQuality === idx ? 'text-violet-400' : 'text-white'
                              }`}
                            >
                              {level.height ? `${level.height}p` : `Level ${idx + 1}`}
                            </button>
                          ))}
                        </>
                      ) : (
                        <button
                          onClick={() => setShowQualityMenu(false)}
                          className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-violet-400 hover:bg-white/15 transition-colors"
                        >
                          Source (1080p)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Picture-in-Picture */}
              <button
                onClick={togglePiP}
                className="text-white hover:text-violet-400 hover:scale-110 transition-all"
                title="Picture-in-Picture (P)"
              >
                <Tv className="h-5 w-5" />
              </button>

              {/* Download */}
              <a
                href={src}
                download={title || 'video.mp4'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-violet-400 hover:scale-110 transition-all"
                title="Download Video"
              >
                <Download className="h-5 w-5" />
              </a>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-violet-400 hover:scale-110 transition-all"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* Skip Double Tap Indicators */}
      {skipIndicator.visible && skipIndicator.type === 'backward' && (
        <div className="absolute left-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1.5 pointer-events-none z-20 animate-fadeIn">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/35 border border-violet-500/30 text-white animate-ping">
            <RotateCcw className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-wider bg-black/60 px-2.5 py-0.5 rounded-full">-10 Seconds</span>
        </div>
      )}
      {skipIndicator.visible && skipIndicator.type === 'forward' && (
        <div className="absolute right-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1.5 pointer-events-none z-20 animate-fadeIn">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/35 border border-violet-500/30 text-white animate-ping">
            <RotateCw className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-wider bg-black/60 px-2.5 py-0.5 rounded-full">+10 Seconds</span>
        </div>
      )}

      {/* Center Feedback Animation */}
      {centerFeedback.visible && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/75 text-white scale-[1.3] opacity-0 animate-[scaleFade_0.6s_ease-out_forwards] border border-white/5">
            {centerFeedback.type === 'play' && <Play className="h-9 w-9 fill-white translate-x-0.5" />}
            {centerFeedback.type === 'pause' && <Pause className="h-9 w-9 fill-white" />}
            {centerFeedback.type === 'mute' && <VolumeX className="h-9 w-9" />}
            {centerFeedback.type === 'unmute' && <Volume2 className="h-9 w-9" />}
            {centerFeedback.type === 'volume' && <Volume2 className="h-9 w-9" />}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Helper */}
      {showShortcutsHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-80 rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl relative">
            <button
              onClick={() => setShowShortcutsHelp(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h4 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
              <Keyboard className="h-4.5 w-4.5 text-violet-500" />
              <span>Keyboard Shortcuts</span>
            </h4>
            <div className="space-y-2 text-xs font-semibold text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Play / Pause</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">Space</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Forward 10s</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">→</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Backward 10s</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">←</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Volume Up / Down</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">↑ / ↓</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Mute / Unmute</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">M</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Fullscreen</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">F</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Picture-in-Picture</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">P</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
