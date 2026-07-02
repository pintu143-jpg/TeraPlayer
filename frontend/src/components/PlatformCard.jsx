import React from 'react';
import { ShieldAlert, BookOpen, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export default function PlatformCard({ result, onReset }) {
  const isTeraBox = result.platform === 'terabox';
  
  return (
    <div className="w-full max-w-3xl mx-auto overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-50/50 p-6 dark:border-amber-500/10 dark:bg-amber-950/20 shadow-xl transition-all duration-300">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        
        {/* Banner Alert Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-6 w-6" />
        </div>

        {/* Card Body */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {result.helpTitle || 'Playback Protected'}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {result.message || 'Direct video streaming is restricted by this platform.'}
          </p>

          <div className="mt-5 rounded-xl border border-slate-200/50 bg-white/70 p-4 dark:border-slate-800/40 dark:bg-slate-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              <BookOpen className="h-3.5 w-3.5" />
              <span>How to watch with CloudStream</span>
            </div>
            
            <ol className="space-y-3">
              {result.helpSteps && result.helpSteps.map((step, idx) => {
                const renderStepContent = (text) => {
                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                  const parts = text.split(urlRegex);
                  return parts.map((part, index) => {
                    if (part.match(urlRegex)) {
                      return (
                        <a 
                          key={index} 
                          href={part} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-violet-600 dark:text-violet-400 hover:underline font-medium break-all"
                        >
                          {part}
                        </a>
                      );
                    }
                    return part;
                  });
                };

                return (
                  <li key={idx} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{renderStepContent(step)}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={
                isTeraBox 
                  ? (result.helpTitle?.includes('Permission') ? "https://console.apify.com/actors/A5crpuk9MB019Qf1r?approvePermissions=true" : "https://www.terabox.com")
                  : (result.helpTitle?.includes('API Key') || result.helpTitle?.includes('Custom') ? "https://diskwala.litedns.xyz" : "https://diskwala.com")
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
            >
              <span>
                {result.helpTitle?.includes('Permission') || result.helpTitle?.includes('API Key') || result.helpTitle?.includes('Custom')
                  ? "Go to Setup Dashboard" 
                  : "Visit official website"}
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
            
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Try another link</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
