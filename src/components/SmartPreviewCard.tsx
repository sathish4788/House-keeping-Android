import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Video,
  Layers,
  Camera,
  Trash2,
  FolderArchive,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { DCIMImage, InstalledApp, SmartPreviewResponse, SmartPreviewSuggestion } from '../types';
import { formatBytes, getDaysAgo } from '../utils/dateUtils';

interface SmartPreviewCardProps {
  images: DCIMImage[];
  apps: InstalledApp[];
  currentWeekFolder: string;
  onMoveImageToHousekeep: (imageId: string, folderName: string) => void;
  onUninstallApp: (appId: string) => void;
  onCleanBatch: (fileIds: string[], appIds: string[], folderName: string) => void;
}

export const SmartPreviewCard: React.FC<SmartPreviewCardProps> = ({
  images,
  apps,
  currentWeekFolder,
  onMoveImageToHousekeep,
  onUninstallApp,
  onCleanBatch
}) => {
  const [data, setData] = useState<SmartPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanedItemIds, setCleanedItemIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSmartPreview = useCallback(async () => {
    setLoading(true);

    const activeImages = images.filter((i) => i.status === 'in_dcim');
    const activeApps = apps.filter((a) => !a.uninstalled && !a.isSystemApp);

    const payload = {
      currentWeekPhotos: activeImages.map((img) => ({
        id: img.id,
        name: img.name,
        sizeBytes: img.sizeBytes,
        category: img.category,
        status: img.status,
        dateTaken: img.dateTaken
      })),
      installedApps: activeApps.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        isSystemApp: a.isSystemApp,
        uninstalled: a.uninstalled,
        daysInactive: getDaysAgo(a.lastUsedDate),
        totalBytes: a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes
      }))
    };

    try {
      const res = await fetch('/api/smart-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const preview: SmartPreviewResponse = await res.json();
        setData(preview);
      }
    } catch (err) {
      console.error('Failed to load Gemini smart preview:', err);
    } finally {
      setLoading(false);
    }
  }, [images, apps]);

  useEffect(() => {
    fetchSmartPreview();
  }, [fetchSmartPreview]);

  // Handle single action
  const handleSingleAction = (sug: SmartPreviewSuggestion) => {
    if (sug.type === 'file') {
      onMoveImageToHousekeep(sug.targetId, currentWeekFolder);
      showToast(`Staged ${sug.name} into ${currentWeekFolder}`);
    } else {
      onUninstallApp(sug.targetId);
      showToast(`Uninstalled ${sug.name} · Freed ${formatBytes(sug.sizeBytes)}`);
    }
    setCleanedItemIds((prev) => [...prev, sug.id]);
  };

  // Handle Clean All High Impact Levers
  const handleCleanAll = () => {
    if (!data) return;
    const remaining = data.smartSuggestions.filter((s) => !cleanedItemIds.includes(s.id));
    if (remaining.length === 0) return;

    const fileIds = remaining.filter((s) => s.type === 'file').map((s) => s.targetId);
    const appIds = remaining.filter((s) => s.type === 'app').map((s) => s.targetId);
    const totalFreed = remaining.reduce((sum, s) => sum + s.sizeBytes, 0);

    onCleanBatch(fileIds, appIds, currentWeekFolder);
    setCleanedItemIds(data.smartSuggestions.map((s) => s.id));
    showToast(`Cleaned ${remaining.length} high-impact levers! Freed ${formatBytes(totalFreed)}`);
  };

  const remainingSuggestions = (data?.smartSuggestions || []).filter(
    (s) => !cleanedItemIds.includes(s.id)
  );

  const remainingBytes = remainingSuggestions.reduce((sum, s) => sum + s.sizeBytes, 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-20 p-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Preview</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Gemini AI Priority Detection</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{currentWeekFolder}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Smart Suggestions — High Storage Impact Levers
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gemini evaluated your week&apos;s photos and apps to detect which specific items give you the highest storage return if cleaned right now.
          </p>
        </div>

        <button
          onClick={fetchSmartPreview}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-60 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{loading ? 'Analyzing...' : 'Re-Analyze'}</span>
        </button>
      </div>

      {loading && !data ? (
        /* Loading skeleton */
        <div className="space-y-3 animate-pulse">
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Headline Banner with One-Tap Clean All */}
          {remainingSuggestions.length > 0 ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Top Leverage Summary
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.2 rounded">
                      +{formatBytes(remainingBytes)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                    {data.summaryHeadline}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCleanAll}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
              >
                <span>Clean All High Impact Levers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>All highlighted high-impact levers have been cleaned for this week!</span>
              </div>
              <button
                onClick={fetchSmartPreview}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Run fresh scan
              </button>
            </div>
          )}

          {/* Smart Suggestions Box */}
          <div className="space-y-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Specific High-Payoff Items Identified by Gemini:
            </span>

            <div className="space-y-2.5">
              {data.smartSuggestions.map((sug) => {
                const isCleaned = cleanedItemIds.includes(sug.id);

                return (
                  <div
                    key={sug.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCleaned
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 opacity-70'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 mt-0.5">
                          {sug.type === 'file' ? (
                            sug.impactBadge.includes('Video') ? (
                              <Video className="w-4 h-4 text-violet-500" />
                            ) : (
                              <Camera className="w-4 h-4 text-indigo-500" />
                            )
                          ) : (
                            <Layers className="w-4 h-4 text-sky-500" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {sug.name}
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {sug.impactBadge}
                            </span>
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {formatBytes(sug.sizeBytes)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                            {sug.aiRationale}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        {isCleaned ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Cleaned</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSingleAction(sug)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                              sug.type === 'file'
                                ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800'
                                : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800'
                            }`}
                          >
                            {sug.type === 'file' ? (
                              <FolderArchive className="w-3.5 h-3.5 text-indigo-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <span>{sug.actionLabel}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
