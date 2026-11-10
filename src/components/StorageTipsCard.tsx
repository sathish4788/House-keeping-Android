import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Video,
  Layers,
  Camera,
  Calendar,
  Trash2,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Zap,
  Film
} from 'lucide-react';
import { StorageDeviceStatus, DCIMImage, InstalledApp, MonthlyStorageGain, AIStorageTipsResponse, StorageTip } from '../types';
import { getDaysAgo } from '../utils/dateUtils';

interface StorageTipsCardProps {
  storage: StorageDeviceStatus;
  images: DCIMImage[];
  apps: InstalledApp[];
  monthlyGains: MonthlyStorageGain[];
  onNavigateTab: (tab: 'dcim' | 'dormant_apps' | 'housekeep' | 'download_archive') => void;
}

export const StorageTipsCard: React.FC<StorageTipsCardProps> = ({
  storage,
  images,
  apps,
  monthlyGains,
  onNavigateTab
}) => {
  const [tipsData, setTipsData] = useState<AIStorageTipsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchAiTips = useCallback(async () => {
    setLoading(true);

    // Compute stats to send to server
    const activeImages = images.filter((i) => i.status !== 'backed_up_to_harddisk');
    const videos = activeImages.filter((i) => i.category === 'large_video' || i.category === 'downloaded_movie');
    const duplicates = activeImages.filter((i) => i.category === 'duplicate' || i.category === 'burst');
    const screenshots = activeImages.filter((i) => i.category === 'screenshot');
    const downloadMedia = activeImages.filter((i) => i.source && i.source !== 'dcim');

    const videoBytes = videos.reduce((acc, v) => acc + v.sizeBytes, 0);
    const duplicateBytes = duplicates.reduce((acc, d) => acc + d.sizeBytes, 0);
    const downloadsBytes = downloadMedia.reduce((acc, d) => acc + d.sizeBytes, 0);

    const activeApps = apps.filter((a) => !a.uninstalled && !a.isSystemApp);
    const dormantApps = activeApps.filter((a) => getDaysAgo(a.lastUsedDate) >= 30);
    const dormantBytes = dormantApps.reduce(
      (acc, a) => acc + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes,
      0
    );

    const payload = {
      storage,
      dcimSummary: {
        totalImagesCount: activeImages.length,
        videoCount: videos.length,
        videoBytes,
        duplicateCount: duplicates.length,
        duplicateBytes,
        screenshotCount: screenshots.length
      },
      downloadsSummary: {
        count: downloadMedia.length,
        totalBytes: downloadsBytes,
        whatsappCount: downloadMedia.filter((m) => m.source === 'whatsapp').length,
        telegramCount: downloadMedia.filter((m) => m.source === 'telegram').length,
        movieCount: downloadMedia.filter((m) => m.category === 'downloaded_movie').length
      },
      dormantAppsSummary: {
        count: dormantApps.length,
        totalBytes: dormantBytes,
        topApps: dormantApps.slice(0, 4).map((a) => ({
          name: a.name,
          daysInactive: getDaysAgo(a.lastUsedDate),
          sizeBytes: a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes
        }))
      },
      monthlyGains: monthlyGains.slice(-3)
    };

    try {
      const res = await fetch('/api/storage-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data: AIStorageTipsResponse = await res.json();
        setTipsData(data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load Gemini AI storage tips:', err);
    } finally {
      setLoading(false);
    }
  }, [storage, images, apps, monthlyGains]);

  useEffect(() => {
    fetchAiTips();
  }, [fetchAiTips]);

  const getCategoryIcon = (category: StorageTip['category']) => {
    switch (category) {
      case 'download_archive':
        return <Film className="w-4 h-4 text-purple-500" />;
      case 'dcim_video':
        return <Video className="w-4 h-4 text-violet-500" />;
      case 'dormant_apps':
        return <Layers className="w-4 h-4 text-sky-500" />;
      case 'burst_cleanup':
        return <Camera className="w-4 h-4 text-indigo-500" />;
      case 'housekeep_cadence':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'cache_hygiene':
      default:
        return <Trash2 className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini AI Storage Coach</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Personalized Habit Recommendations</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Smart Space-Saving Habits &amp; Trade-Offs
          </h3>
        </div>

        <button
          onClick={fetchAiTips}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-60 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{loading ? 'Analyzing with Gemini...' : 'Refresh AI Tips'}</span>
        </button>
      </div>

      {loading && !tipsData ? (
        /* Loading skeleton */
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      ) : tipsData ? (
        <div className="space-y-4">
          {/* Main Key Takeaway Banner */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Key Space-Saving Insight
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  {tipsData.headline}
                </p>
              </div>
            </div>
          </div>

          {/* Rule of thumb callout */}
          {tipsData.comparisonInsight && (
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {tipsData.comparisonInsight}
              </span>
            </div>
          )}

          {/* Habit Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {tipsData.tips.map((tip) => (
              <div
                key={tip.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getCategoryIcon(tip.category)}
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {tip.title}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{tip.impact}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {tip.habit}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Recommended action:
                  </span>
                  <button
                    onClick={() => onNavigateTab(tip.actionTab)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{tip.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
