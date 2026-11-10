import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FolderArchive,
  Layers,
  Trash2,
  CheckCircle2,
  X,
  HardDrive,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { DCIMImage, InstalledApp, HousekeepFolderSettings } from '../types';
import { formatBytes, generateHousekeepFolderName, generateDownloadArchiveFolderName, getDaysAgo } from '../utils/dateUtils';

interface WeeklyScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: DCIMImage[];
  apps: InstalledApp[];
  folderSettings: HousekeepFolderSettings;
  onApplyHousekeeping: (params: {
    folderName: string;
    moveImageIds: string[];
    archiveDownloadMediaIds?: string[];
    downloadArchiveFolderName?: string;
    uninstallAppIds: string[];
    cacheFreedBytes: number;
    duplicatesFreedBytes: number;
  }) => void;
}

export const WeeklyScanModal: React.FC<WeeklyScanModalProps> = ({
  isOpen,
  onClose,
  images,
  apps,
  folderSettings,
  onApplyHousekeeping
}) => {
  const [scanStep, setScanStep] = useState<'scanning' | 'results' | 'applied'>('scanning');
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanningTarget, setCurrentScanningTarget] = useState('Initializing scan...');

  // Selection states for findings
  const [includeDcimMove, setIncludeDcimMove] = useState(true);
  const [includeDownloadArchive, setIncludeDownloadArchive] = useState(true);
  const [includeDormantApps, setIncludeDormantApps] = useState(true);
  const [includeCacheClean, setIncludeCacheClean] = useState(true);
  const [includeDuplicates, setIncludeDuplicates] = useState(true);

  const targetFolderName = generateHousekeepFolderName(
    new Date(),
    folderSettings.namingTemplate,
    folderSettings.prefixFolder
  );

  const downloadArchiveFolderName = generateDownloadArchiveFolderName(
    new Date(),
    folderSettings.namingTemplate
  );

  // Eligible DCIM photos (camera)
  const eligibleDcimImages = images.filter((img) => (!img.source || img.source === 'dcim') && img.status === 'in_dcim');
  const dcimBytes = eligibleDcimImages.reduce((sum, img) => sum + img.sizeBytes, 0);

  // Eligible Downloaded & Chat Media (WhatsApp, Telegram, Downloads)
  const eligibleDownloadMedia = images.filter((img) => img.source && img.source !== 'dcim' && img.status === 'in_dcim');
  const downloadBytes = eligibleDownloadMedia.reduce((sum, img) => sum + img.sizeBytes, 0);

  // Dormant apps (> 30 days unused, non-system, active)
  const dormantApps = apps.filter(
    (app) => !app.uninstalled && !app.isSystemApp && getDaysAgo(app.lastUsedDate) >= 30
  );
  const appsBytes = dormantApps.reduce(
    (sum, a) => sum + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes,
    0
  );

  // Duplicates
  const duplicateImages = eligibleDcimImages.filter((img) => img.category === 'duplicate');
  const duplicatesBytes = duplicateImages.reduce((sum, img) => sum + img.sizeBytes, 0);

  // Cache & Temp
  const estimatedCacheBytes = 650 * 1024 * 1024; // 650 MB

  // Calculate selected total
  const selectedTotalBytes =
    (includeDcimMove ? dcimBytes : 0) +
    (includeDownloadArchive ? downloadBytes : 0) +
    (includeDormantApps ? appsBytes : 0) +
    (includeCacheClean ? estimatedCacheBytes : 0) +
    (includeDuplicates ? duplicatesBytes : 0);

  // Run scanning animation when opened
  useEffect(() => {
    if (!isOpen) {
      setScanStep('scanning');
      setScanProgress(0);
      return;
    }

    setScanStep('scanning');
    setScanProgress(5);
    setCurrentScanningTarget('Indexing /DCIM/Camera directory...');

    const timer1 = setTimeout(() => {
      setScanProgress(25);
      setCurrentScanningTarget('Scanning photo dates & week grouping...');
    }, 500);

    const timer2 = setTimeout(() => {
      setScanProgress(50);
      setCurrentScanningTarget('Auditing WhatsApp, Telegram & Downloads folder for large movies...');
    }, 1000);

    const timer3 = setTimeout(() => {
      setScanProgress(75);
      setCurrentScanningTarget('Auditing installed apps for 30+ day inactivity...');
    }, 1500);

    const timer4 = setTimeout(() => {
      setScanProgress(90);
      setCurrentScanningTarget('Calculating duplicate shots & temp cache...');
    }, 2000);

    const timer5 = setTimeout(() => {
      setScanProgress(100);
      setCurrentScanningTarget('Scan complete!');
      setScanStep('results');
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyHousekeeping({
      folderName: targetFolderName,
      moveImageIds: includeDcimMove ? eligibleDcimImages.map((i) => i.id) : [],
      archiveDownloadMediaIds: includeDownloadArchive ? eligibleDownloadMedia.map((i) => i.id) : [],
      downloadArchiveFolderName: downloadArchiveFolderName,
      uninstallAppIds: includeDormantApps ? dormantApps.map((a) => a.id) : [],
      cacheFreedBytes: includeCacheClean ? estimatedCacheBytes : 0,
      duplicatesFreedBytes: includeDuplicates ? duplicatesBytes : 0
    });
    setScanStep('applied');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Weekly Phone Housekeeping Run
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated storage audit for DCIM photos, dormant apps, and system clutter
            </p>
          </div>
        </div>

        {/* Body based on step */}
        {scanStep === 'scanning' && (
          <div className="py-12 px-4 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-indigo-950/60 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {scanProgress}%
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Auditing Phone Storage...
              </h3>
              <p className="text-xs text-slate-500 font-mono">{currentScanningTarget}</p>
            </div>

            <div className="max-w-xs mx-auto h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${scanProgress}%` }}
                className="h-full bg-indigo-600 transition-all duration-300"
              />
            </div>
          </div>
        )}

        {scanStep === 'results' && (
          <div className="mt-5 space-y-4">
            {/* Grand Total Callout */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Total Reclaimable Potential
                </span>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  +{formatBytes(selectedTotalBytes)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>Target Housekeep Folder:</span>
                <div className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {targetFolderName}
                </div>
              </div>
            </div>

            {/* Opportunities Checklist */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Detected Storage Saving Possibilities:
              </p>

              {/* 1. DCIM Photos Staging */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  includeDcimMove
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeDcimMove}
                  onChange={(e) => setIncludeDcimMove(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FolderArchive className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Stage DCIM Images into Weekly Housekeep Folder</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(dcimBytes)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Organize {eligibleDcimImages.length} camera photos into{' '}
                    <code className="text-indigo-600 dark:text-indigo-400">{targetFolderName}</code> for external hard disk backup.
                  </p>
                </div>
              </label>

              {/* 2. Download Archive (WhatsApp, Telegram, Downloads) */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  includeDownloadArchive
                    ? 'border-purple-600 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeDownloadArchive}
                  onChange={(e) => setIncludeDownloadArchive(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FolderArchive className="w-3.5 h-3.5 text-purple-600" />
                      <span>Archive WhatsApp, Telegram &amp; Downloaded Movies</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(downloadBytes)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Stage {eligibleDownloadMedia.length} chat clips and movies into{' '}
                    <code className="text-purple-600 dark:text-purple-400">{downloadArchiveFolderName}</code>.
                  </p>
                </div>
              </label>

              {/* 3. Dormant Apps Uninstallation */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  includeDormantApps
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeDormantApps}
                  onChange={(e) => setIncludeDormantApps(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-600" />
                      <span>Uninstall Inactive Apps (&gt; 30 Days Unused)</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(appsBytes)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Found {dormantApps.length} apps unused for over 30 days ({dormantApps.map((a) => a.name).slice(0, 3).join(', ')}...).
                  </p>
                </div>
              </label>

              {/* 3. Cache & Junk files */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  includeCacheClean
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeCacheClean}
                  onChange={(e) => setIncludeCacheClean(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Clean Browser & App Cache Junk</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(estimatedCacheBytes)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Temporary thumbnails, cached videos, and expired download logs.
                  </p>
                </div>
              </label>

              {/* 4. Duplicate photos */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  includeDuplicates
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeDuplicates}
                  onChange={(e) => setIncludeDuplicates(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-violet-600" />
                      <span>Trim Duplicate & Burst Camera Shots</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBytes(duplicatesBytes)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Found {duplicateImages.length} burst shot duplicates in DCIM.
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={selectedTotalBytes === 0}
                onClick={handleApply}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <span>Execute Weekly Housekeeping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {scanStep === 'applied' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Weekly Housekeeping Complete!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                Successfully organized images into <code className="font-mono text-indigo-600 dark:text-indigo-400">{targetFolderName}</code>, removed dormant apps, and recorded gains to your 6-month report.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold w-fit mx-auto">
              +{formatBytes(selectedTotalBytes)} Total Space Reclaimed
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
