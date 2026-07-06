import React, { useEffect, useRef } from 'react';

export default function AdBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    if (!adRef.current) return;
    
    // Clear container to prevent duplicate elements on fast re-renders
    adRef.current.innerHTML = '';

    // 1. Create the configuration script
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.innerHTML = `
      atOptions = {
        'key' : '7cf11960d2c892c92700b1118f1d1beb',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    // 2. Create the script element loading the script source
    const loadScript = document.createElement('script');
    loadScript.type = 'text/javascript';
    loadScript.src = 'https://clenchinfer.com/7cf11960d2c892c92700b1118f1d1beb/invoke.js';

    // Append both scripts to the ref element
    adRef.current.appendChild(configScript);
    adRef.current.appendChild(loadScript);

    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center my-6 select-none w-full animate-fadeIn">
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
        Sponsored Advertisement
      </span>
      <div 
        ref={adRef} 
        style={{ width: '300px', height: '250px' }} 
        className="overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/5 dark:bg-slate-900/5 backdrop-blur-md shadow-sm flex items-center justify-center min-w-[300px] min-h-[250px]"
      />
    </div>
  );
}
