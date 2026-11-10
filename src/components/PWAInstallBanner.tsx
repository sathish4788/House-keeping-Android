import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed or dismissed, hide banner
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Attractive HK Logo Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-md flex items-center justify-center shrink-0">
              <span className="font-mono font-black text-xl tracking-tighter text-white drop-shadow-sm">
                HK
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  App Manifestation
                </span>
                <span className="text-xs text-indigo-200">· Phones &amp; Tablets</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                Install HousekeepOS as a Standalone App
              </h4>
              <p className="text-xs text-indigo-100/80 max-w-lg">
                Pin to your Android home screen or iPad/iPhone for instant weekly DCIM housekeeping and 1-tap dormant app cleanups anywhere.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {isInstallable ? (
              <button
                onClick={install}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 active:scale-[0.98] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Install HK App</span>
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 active:scale-[0.98] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share className="w-4 h-4 text-indigo-600" />
                <span>Add to Home Screen (iOS)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 active:scale-[0.98] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>Install on Phone / Tablet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* iOS / Universal Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-md flex items-center justify-center shrink-0">
                <span className="font-mono font-black text-xl tracking-tighter text-white">
                  HK
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Manifest HK on Your Device
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quick 2-step setup for iOS, iPadOS &amp; Android
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Open Share or Browser Menu
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    On Safari tap the <strong>Share</strong> icon (box with up arrow). On Chrome/Edge tap the <strong>⋮ three dots menu</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Tap &quot;Add to Home Screen&quot;
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    The attractive <strong>HK</strong> logo will appear on your device launcher, running full screen like a native app.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Full offline support and zero browser address bar clutter!</span>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
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
