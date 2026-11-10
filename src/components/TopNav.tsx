import React, { useState } from 'react';
import { Sparkles, Moon, Sun, HardDrive, Download, Share, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopNavProps {
  activeTab: 'housekeep' | 'download_archive' | 'dormant_apps' | 'dcim' | 'report' | 'settings';
  setActiveTab: (tab: 'housekeep' | 'download_archive' | 'dormant_apps' | 'dcim' | 'report' | 'settings') => void;
  onOpenScan: () => void;
  onOpenHardDiskModal: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  dormantAppsCount: number;
  unarchivedImagesCount: number;
  pendingDownloadsCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenScan,
  onOpenHardDiskModal,
  darkMode,
  toggleDarkMode,
  dormantAppsCount,
  unarchivedImagesCount,
  pendingDownloadsCount = 0
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark with HK attractive logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('housekeep')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              {/* Attractive HK Gradient Monogram Logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-600 text-white flex items-center justify-center font-mono font-black text-sm tracking-tighter shadow-sm border border-indigo-400/30 group-hover:scale-105 transition-transform">
                HK
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                HousekeepOS
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single line, clean text) */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setActiveTab('housekeep')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                activeTab === 'housekeep'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekly Housekeep
            </button>

            <button
              onClick={() => setActiveTab('download_archive')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'download_archive'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Download Archive</span>
              {pendingDownloadsCount > 0 && (
                <span className="text-xs font-mono font-semibold px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded">
                  {pendingDownloadsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dormant_apps')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'dormant_apps'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Dormant Apps</span>
              {dormantAppsCount > 0 && (
                <span className="text-xs font-mono font-semibold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded">
                  {dormantAppsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dcim')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'dcim'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>DCIM Folders</span>
              {unarchivedImagesCount > 0 && (
                <span className="text-xs font-mono px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded">
                  {unarchivedImagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'report'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6-Month Report
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'settings'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Schedule &amp; Rules
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Utility */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Install PWA Button (Hides when already installed) */}
            {!isInstalled && (
              isInstallable ? (
                <button
                  onClick={install}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Install HK on this device"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Install HK</span>
                </button>
              ) : isIOS ? (
                <button
                  onClick={() => setShowIOSModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Install HK on iPhone or iPad"
                >
                  <Share className="w-3.5 h-3.5" />
                  <span>Install HK</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowIOSModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Install HK App"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install HK</span>
                </button>
              )
            )}

            <button
              onClick={onOpenHardDiskModal}
              title="External Hard Disk Transfer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Hard Disk</span>
            </button>

            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenScan}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-lg shadow-sm shadow-indigo-600/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Housekeeping</span>
            </button>
          </div>
        </div>
      </header>

      {/* In-app guide modal for iOS / universal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-mono font-black text-xl tracking-tighter shrink-0">
                HK
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Install HousekeepOS
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phone &amp; Tablet Standalone Manifestation
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Manifest HousekeepOS directly onto your phone or tablet home screen for full offline capability, clean full-screen viewing, and faster access to your DCIM weekly cleanups.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Safari (iPhone / iPad):
              </div>
              <p className="text-[11px] text-slate-500">
                Tap the <strong>Share</strong> button, then scroll and select <strong>&quot;Add to Home Screen&quot;</strong>.
              </p>
              <div className="font-semibold text-slate-800 dark:text-slate-200 pt-1">
                Chrome / Edge (Android / Tablet):
              </div>
              <p className="text-[11px] text-slate-500">
                Tap the <strong>three dots menu (⋮)</strong>, then tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
