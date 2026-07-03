import React from 'react';
import { Sun, Moon, Play } from 'lucide-react';

export default function Header({ darkMode, setDarkMode, onHome }) {
  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-md transition-colors dark:border-slate-800/50 dark:bg-slate-900/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div 
          onClick={onHome}
          className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 active:scale-95 transition-all"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-indigo-600 shadow-lg shadow-violet-500/30 group hover:scale-105 transition-all duration-300 overflow-hidden border border-white/10">
            {/* Ambient inner radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18)_0%,transparent_70%)] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            <svg viewBox="0 0 24 24" className="h-5.5 w-5.5 text-white z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" stroke="url(#logo-grad)" strokeWidth="2" className="animate-[spin_6s_linear_infinite]" strokeDasharray="6 4" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="0.5" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="1" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-indigo-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent dark:from-violet-400 dark:via-indigo-300 dark:to-violet-300">
              TeraPlayer
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Universal Cloud Player
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/60 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 transition-all duration-200"
            aria-label="Toggle Theme"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-amber-500 animate-pulse" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-600" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
