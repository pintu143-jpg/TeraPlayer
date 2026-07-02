import React from 'react';
import { X, Shield, FileText, AlertTriangle, Mail, Info } from 'lucide-react';

export default function LegalModals({ isOpen, activeTab, setActiveTab, onClose }) {
  if (!isOpen) return null;

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Use', icon: FileText },
    { id: 'dmca', label: 'DMCA Disclaimer', icon: AlertTriangle },
    { id: 'contact', label: 'Contact Us', icon: Mail }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card Container */}
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl h-[85vh] md:h-[70vh] rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-3 mb-4">
            <Info className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Legal Center
            </span>
          </div>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap md:w-full ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white capitalize flex items-center gap-2">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 font-medium">
            
            {activeTab === 'privacy' && (
              <>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">Privacy Policy</h4>
                <p>
                  At AeroStock, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by AeroStock and how we use it.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Log Files & Usage Data</h5>
                <p>
                  AeroStock follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Cookies and Web Beacons</h5>
                <p>
                  Like any other website, AeroStock uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Google DoubleClick DART Cookie & Third-Party Ads</h5>
                <p>
                  Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors. Other advertising partners (like PropellerAds, Adsterra) may also use cookies, JavaScript, or Web Beacons to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content. AeroStock has no access to or control over these cookies used by third-party advertisers.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Consent</h5>
                <p>
                  By using our website, you hereby consent to our Privacy Policy and agree to its terms.
                </p>
              </>
            )}

            {activeTab === 'terms' && (
              <>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">Terms of Use</h4>
                <p>
                  Welcome to AeroStock. By accessing this website, you agree to comply with and be bound by the following terms and conditions of use.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Use of the Service</h5>
                <p>
                  AeroStock provides an online search and download utility. You agree to use this website only for lawful, personal, and non-commercial purposes. You are solely responsible for ensuring that your downloads and utilization of media conform to CC0 stock licenses.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">No Content Hosting</h5>
                <p>
                  You acknowledge that AeroStock does not host, store, upload, or database any video content on its servers. We act purely as a gateway, querying third-party APIs (such as Pexels) and serving public media streams directly to your client browser.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Limitations of Liability</h5>
                <p>
                  In no event shall AeroStock or its developers be liable for any damages arising out of the use or inability to use the materials on AeroStock's website. The service is provided "as is" without any warranties.
                </p>
              </>
            )}

            {activeTab === 'dmca' && (
              <>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">DMCA & Copyright Policy</h4>
                <p>
                  AeroStock takes copyright infringements very seriously. We comply with the Digital Millennium Copyright Act ("DMCA") and international copyright regulations.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Zero Content Hosting Policy</h5>
                <p>
                  AeroStock is a search tool and media player wrapper. We do not host any files, videos, or audio contents on our servers. All search results and video streams are retrieved dynamically via external stock footage APIs (such as Pexels API) and delivered directly from their official servers/CDNs.
                </p>
                <h5 className="font-bold text-slate-700 dark:text-slate-200">Takedown Requests</h5>
                <p>
                  If you are a copyright owner and believe that files listed on our search engine violate your copyright, please report the file directly to the third-party API hosts (Pexels) where the media is hosted.
                </p>
                <p>
                  Alternatively, you can email us at <span className="text-violet-500 font-bold">dmca@aerostock.com</span> with details (including the specific API URL and video IDs). We will gladly block or blacklist those specific search results from appearing in our player within 48 hours.
                </p>
              </>
            )}

            {activeTab === 'contact' && (
              <>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">Contact Us & About AeroStock</h4>
                <p>
                  AeroStock was developed to empower creators, developers, and designers with instant access to high-quality, 100% royalty-free stock footage. Our tool eliminates copyright issues, ensuring safety and monetization compatibility.
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-violet-500" />
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-white">Email Address</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">support@aerostock.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <Info className="h-5 w-5 text-violet-500" />
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-white">Business Inquiries</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">partner@aerostock.com</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4">
                  We value your feedback and recommendations. If you have feature requests or want to partner with us, please reach out to our email addresses listed above.
                </p>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
