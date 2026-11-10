import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  FolderArchive,
  BarChart3,
  HardDrive,
  CheckCircle2,
  Calendar,
  Smartphone,
  Sliders,
  Laptop,
  Film
} from 'lucide-react';
import {
  DCIMImage,
  InstalledApp,
  MonthlyStorageGain,
  HousekeepRun,
  StorageDeviceStatus,
  HousekeepFolderSettings
} from './types';
import {
  INITIAL_DCIM_IMAGES,
  INITIAL_INSTALLED_APPS,
  INITIAL_MONTHLY_GAINS,
  INITIAL_HOUSEKEEP_RUNS,
  INITIAL_STORAGE_STATUS,
  INITIAL_FOLDER_SETTINGS
} from './data/mockData';
import { generateHousekeepFolderName, generateDownloadArchiveFolderName, getDaysAgo, formatBytes } from './utils/dateUtils';
import { TopNav } from './components/TopNav';
import { BottomTabBar } from './components/BottomTabBar';
import { StorageOverviewCard } from './components/StorageOverviewCard';
import { SmartPreviewCard } from './components/SmartPreviewCard';
import { StorageTipsCard } from './components/StorageTipsCard';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DCIMHousekeeper } from './components/DCIMHousekeeper';
import { DownloadArchiveManager } from './components/DownloadArchiveManager';
import { DormantAppsManager } from './components/DormantAppsManager';
import { SixMonthReportChart } from './components/SixMonthReportChart';
import { WeeklyScanModal } from './components/WeeklyScanModal';
import { HardDiskConnectModal } from './components/HardDiskConnectModal';
import { WeeklyScheduleCard } from './components/WeeklyScheduleCard';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Device simulation toggle (Desktop dashboard vs Phone shell simulator)
  const [viewMode, setViewMode] = useState<'responsive' | 'phone_shell'>('responsive');

  // Application Data State
  const [images, setImages] = useState<DCIMImage[]>(INITIAL_DCIM_IMAGES);
  const [apps, setApps] = useState<InstalledApp[]>(INITIAL_INSTALLED_APPS);
  const [storage, setStorage] = useState<StorageDeviceStatus>(INITIAL_STORAGE_STATUS);
  const [monthlyGains, setMonthlyGains] = useState<MonthlyStorageGain[]>(INITIAL_MONTHLY_GAINS);
  const [housekeepRuns, setHousekeepRuns] = useState<HousekeepRun[]>(INITIAL_HOUSEKEEP_RUNS);
  const [folderSettings, setFolderSettings] = useState<HousekeepFolderSettings>(INITIAL_FOLDER_SETTINGS);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'housekeep' | 'download_archive' | 'dormant_apps' | 'dcim' | 'report' | 'settings'>('housekeep');

  // Modals
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isHardDiskModalOpen, setIsHardDiskModalOpen] = useState(false);

  // Computations
  const dormantAppsCount = apps.filter((a) => !a.uninstalled && !a.isSystemApp && getDaysAgo(a.lastUsedDate) >= 30).length;
  const dormantAppsBytes = apps
    .filter((a) => !a.uninstalled && !a.isSystemApp && getDaysAgo(a.lastUsedDate) >= 30)
    .reduce((sum, a) => sum + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes, 0);

  // DCIM camera images
  const unarchivedImages = images.filter((i) => (!i.source || i.source === 'dcim') && i.status === 'in_dcim');
  const unarchivedImagesBytes = unarchivedImages.reduce((sum, i) => sum + i.sizeBytes, 0);

  // Chat & Download media (WhatsApp, Telegram, Downloads folder)
  const pendingDownloads = images.filter((i) => i.source && i.source !== 'dcim' && i.status === 'in_dcim');
  const pendingDownloadsBytes = pendingDownloads.reduce((sum, i) => sum + i.sizeBytes, 0);

  const stagedImages = images.filter((i) => i.status === 'staged_housekeep');
  const stagedImagesBytes = stagedImages.reduce((sum, i) => sum + i.sizeBytes, 0);

  const reclaimableBytes = unarchivedImagesBytes + pendingDownloadsBytes + dormantAppsBytes + 650 * 1024 * 1024; // with cache

  // Handlers
  const handleMoveImagesToHousekeep = (imageIds: string[], folderName: string) => {
    setImages((prev) =>
      prev.map((img) =>
        imageIds.includes(img.id)
          ? { ...img, status: 'staged_housekeep' as const, housekeepFolder: folderName }
          : img
      )
    );
  };

  const handleArchiveMediaToDownloadArchive = (mediaIds: string[], folderName: string) => {
    setImages((prev) =>
      prev.map((img) =>
        mediaIds.includes(img.id)
          ? { ...img, status: 'staged_housekeep' as const, housekeepFolder: folderName }
          : img
      )
    );
  };

  const handleConfirmHardDiskBackup = (folderName: string, driveName: string, freedBytes: number) => {
    // Record backup metadata
    setImages((prev) =>
      prev.map((img) =>
        img.housekeepFolder === folderName
          ? { ...img, backedUpAt: new Date().toISOString() }
          : img
      )
    );
  };

  const handleFreePhoneSpace = (imageIds: string[], folderName: string) => {
    const imagesToFree = images.filter((i) => imageIds.includes(i.id));
    const freedBytes = imagesToFree.reduce((sum, i) => sum + i.sizeBytes, 0);

    // Update images status to backed_up_to_harddisk (freed from phone storage)
    setImages((prev) =>
      prev.map((img) =>
        imageIds.includes(img.id)
          ? { ...img, status: 'backed_up_to_harddisk' as const, backedUpAt: new Date().toISOString() }
          : img
      )
    );

    // Recalculate storage
    setStorage((prev) => ({
      ...prev,
      dcimBytes: Math.max(0, prev.dcimBytes - freedBytes),
      usedBytes: Math.max(0, prev.usedBytes - freedBytes),
      freeBytes: Math.min(prev.totalCapacityBytes, prev.freeBytes + freedBytes)
    }));

    // Update 6-month gains report for November
    setMonthlyGains((prev) =>
      prev.map((m) =>
        m.monthShort === 'Nov'
          ? {
              ...m,
              dcimPhotosBytes: m.dcimPhotosBytes + freedBytes,
              totalGainsBytes: m.totalGainsBytes + freedBytes
            }
          : m
      )
    );

    // Add run to audit log
    const newRun: HousekeepRun = {
      id: `run-${Date.now()}`,
      runDate: new Date().toISOString(),
      weekNumber: 2,
      monthName: 'November',
      year: 2026,
      folderName,
      imagesCount: imagesToFree.length,
      imagesSizeBytes: freedBytes,
      appsUninstalledCount: 0,
      appsFreedBytes: 0,
      cacheFreedBytes: 0,
      duplicatesFreedBytes: 0,
      totalFreedBytes: freedBytes,
      status: 'completed',
      hardDiskBackupConfirmed: true,
      targetDriveName: 'External Hard Disk'
    };
    setHousekeepRuns((prev) => [newRun, ...prev]);
  };

  const handleUninstallApp = (appId: string) => {
    const target = apps.find((a) => a.id === appId);
    if (!target) return;
    const freedBytes = target.sizeBytes + target.dataSizeBytes + target.cacheSizeBytes;

    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, uninstalled: true, uninstalledAt: new Date().toISOString() } : a))
    );

    setStorage((prev) => ({
      ...prev,
      appsBytes: Math.max(0, prev.appsBytes - freedBytes),
      usedBytes: Math.max(0, prev.usedBytes - freedBytes),
      freeBytes: Math.min(prev.totalCapacityBytes, prev.freeBytes + freedBytes)
    }));

    setMonthlyGains((prev) =>
      prev.map((m) =>
        m.monthShort === 'Nov'
          ? {
              ...m,
              dormantAppsBytes: m.dormantAppsBytes + freedBytes,
              totalGainsBytes: m.totalGainsBytes + freedBytes
            }
          : m
      )
    );
  };

  const handleBatchUninstall = (appIds: string[]) => {
    const targets = apps.filter((a) => appIds.includes(a.id));
    const freedBytes = targets.reduce(
      (sum, a) => sum + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes,
      0
    );

    setApps((prev) =>
      prev.map((a) =>
        appIds.includes(a.id)
          ? { ...a, uninstalled: true, uninstalledAt: new Date().toISOString() }
          : a
      )
    );

    setStorage((prev) => ({
      ...prev,
      appsBytes: Math.max(0, prev.appsBytes - freedBytes),
      usedBytes: Math.max(0, prev.usedBytes - freedBytes),
      freeBytes: Math.min(prev.totalCapacityBytes, prev.freeBytes + freedBytes)
    }));

    setMonthlyGains((prev) =>
      prev.map((m) =>
        m.monthShort === 'Nov'
          ? {
              ...m,
              dormantAppsBytes: m.dormantAppsBytes + freedBytes,
              totalGainsBytes: m.totalGainsBytes + freedBytes
            }
          : m
      )
    );
  };

  const handleMoveSingleImageToHousekeep = (imageId: string, folderName: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? { ...img, status: 'staged_housekeep' as const, housekeepFolder: folderName }
          : img
      )
    );
  };

  const handleCleanBatchSmartPreview = (fileIds: string[], appIds: string[], folderName: string) => {
    if (fileIds.length > 0) {
      setImages((prev) =>
        prev.map((img) =>
          fileIds.includes(img.id)
            ? { ...img, status: 'staged_housekeep' as const, housekeepFolder: folderName }
            : img
        )
      );
    }

    if (appIds.length > 0) {
      const targets = apps.filter((a) => appIds.includes(a.id));
      const freedBytes = targets.reduce(
        (sum, a) => sum + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes,
        0
      );

      setApps((prev) =>
        prev.map((a) =>
          appIds.includes(a.id)
            ? { ...a, uninstalled: true, uninstalledAt: new Date().toISOString() }
            : a
        )
      );

      setStorage((prev) => ({
        ...prev,
        appsBytes: Math.max(0, prev.appsBytes - freedBytes),
        usedBytes: Math.max(0, prev.usedBytes - freedBytes),
        freeBytes: Math.min(prev.totalCapacityBytes, prev.freeBytes + freedBytes)
      }));

      setMonthlyGains((prev) =>
        prev.map((m) =>
          m.monthShort === 'Nov'
            ? {
                ...m,
                dormantAppsBytes: m.dormantAppsBytes + freedBytes,
                totalGainsBytes: m.totalGainsBytes + freedBytes
              }
            : m
        )
      );
    }
  };

  const handleRestoreApp = (appId: string) => {
    const target = apps.find((a) => a.id === appId);
    if (!target) return;
    const reallocatedBytes = target.sizeBytes + target.dataSizeBytes;

    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, uninstalled: false, uninstalledAt: undefined } : a))
    );

    setStorage((prev) => ({
      ...prev,
      appsBytes: prev.appsBytes + reallocatedBytes,
      usedBytes: prev.usedBytes + reallocatedBytes,
      freeBytes: Math.max(0, prev.freeBytes - reallocatedBytes)
    }));
  };

  const handleAddSamplePhoto = () => {
    const now = new Date();
    const id = `img-${Date.now()}`;
    const newImage: DCIMImage = {
      id,
      name: `IMG_${now.toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(Math.random() * 9000 + 1000)}.jpg`,
      dateTaken: now.toISOString(),
      sizeBytes: Math.floor(Math.random() * 8000000 + 4000000), // 4MB - 12MB
      category: 'camera',
      thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%234f46e5"/><text x="150" y="105" font-family="sans-serif" font-size="20" fill="%23ffffff" text-anchor="middle">New Shot 📷</text></svg>`,
      width: 4032,
      height: 3024,
      status: 'in_dcim'
    };

    setImages((prev) => [newImage, ...prev]);
    setStorage((prev) => ({
      ...prev,
      dcimBytes: prev.dcimBytes + newImage.sizeBytes,
      usedBytes: prev.usedBytes + newImage.sizeBytes,
      freeBytes: Math.max(0, prev.freeBytes - newImage.sizeBytes)
    }));
  };

  const handleAddSampleDownload = (source: 'whatsapp' | 'telegram' | 'downloads') => {
    const now = new Date();
    const id = `dl-${Date.now()}`;
    let sample: DCIMImage;

    if (source === 'whatsapp') {
      sample = {
        id,
        name: `VID_WA_${now.toISOString().slice(0, 10).replace(/-/g, '')}_GroupParty.mp4`,
        dateTaken: now.toISOString(),
        sizeBytes: 195 * 1024 * 1024, // 195MB
        category: 'chat_video',
        thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23059669"/><text x="150" y="105" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">WhatsApp Video 💬</text></svg>`,
        width: 1920,
        height: 1080,
        status: 'in_dcim',
        source: 'whatsapp',
        mediaType: 'video',
        originalPath: '/Internal Storage/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video/'
      };
    } else if (source === 'telegram') {
      sample = {
        id,
        name: `TG_Video_${now.toISOString().slice(0, 10).replace(/-/g, '')}_TechDoc.mp4`,
        dateTaken: now.toISOString(),
        sizeBytes: 480 * 1024 * 1024, // 480MB
        category: 'large_video',
        thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%230284c7"/><text x="150" y="105" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">Telegram HD Clip ✈️</text></svg>`,
        width: 1920,
        height: 1080,
        status: 'in_dcim',
        source: 'telegram',
        mediaType: 'video',
        originalPath: '/Internal Storage/Telegram/Telegram Video/'
      };
    } else {
      sample = {
        id,
        name: `Movie_SciFi_Indie_${now.getFullYear()}_Cut.mp4`,
        dateTaken: now.toISOString(),
        sizeBytes: 880 * 1024 * 1024, // 880MB
        category: 'downloaded_movie',
        thumbnailUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%237c3aed"/><text x="150" y="105" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">Movie Download 🎬</text></svg>`,
        width: 1920,
        height: 1080,
        status: 'in_dcim',
        source: 'downloads',
        mediaType: 'movie',
        originalPath: '/Internal Storage/Download/'
      };
    }

    setImages((prev) => [sample, ...prev]);
    setStorage((prev) => ({
      ...prev,
      usedBytes: prev.usedBytes + sample.sizeBytes,
      freeBytes: Math.max(0, prev.freeBytes - sample.sizeBytes)
    }));
  };

  const handleApplyWeeklyHousekeeping = (params: {
    folderName: string;
    moveImageIds: string[];
    archiveDownloadMediaIds?: string[];
    downloadArchiveFolderName?: string;
    uninstallAppIds: string[];
    cacheFreedBytes: number;
    duplicatesFreedBytes: number;
  }) => {
    // 1. Move images to weekly housekeep folder
    if (params.moveImageIds.length > 0) {
      setImages((prev) =>
        prev.map((img) =>
          params.moveImageIds.includes(img.id)
            ? { ...img, status: 'staged_housekeep', housekeepFolder: params.folderName }
            : img
        )
      );
    }

    // 1b. Move WhatsApp, Telegram & Downloaded movies to dated download_archive folder
    if (params.archiveDownloadMediaIds && params.archiveDownloadMediaIds.length > 0 && params.downloadArchiveFolderName) {
      setImages((prev) =>
        prev.map((img) =>
          params.archiveDownloadMediaIds!.includes(img.id)
            ? { ...img, status: 'staged_housekeep', housekeepFolder: params.downloadArchiveFolderName }
            : img
        )
      );
    }

    // 2. Uninstall dormant apps
    let appsFreed = 0;
    if (params.uninstallAppIds.length > 0) {
      const targets = apps.filter((a) => params.uninstallAppIds.includes(a.id));
      appsFreed = targets.reduce(
        (sum, a) => sum + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes,
        0
      );
      setApps((prev) =>
        prev.map((a) =>
          params.uninstallAppIds.includes(a.id)
            ? { ...a, uninstalled: true, uninstalledAt: new Date().toISOString() }
            : a
        )
      );
    }

    // 3. Clear cache
    const totalFreedImmediate = appsFreed + params.cacheFreedBytes + params.duplicatesFreedBytes;

    setStorage((prev) => ({
      ...prev,
      appsBytes: Math.max(0, prev.appsBytes - appsFreed),
      otherBytes: Math.max(0, prev.otherBytes - params.cacheFreedBytes),
      usedBytes: Math.max(0, prev.usedBytes - totalFreedImmediate),
      freeBytes: Math.min(prev.totalCapacityBytes, prev.freeBytes + totalFreedImmediate)
    }));

    // 4. Update monthly gains for November
    setMonthlyGains((prev) =>
      prev.map((m) =>
        m.monthShort === 'Nov'
          ? {
              ...m,
              dormantAppsBytes: m.dormantAppsBytes + appsFreed,
              cacheTempBytes: m.cacheTempBytes + params.cacheFreedBytes,
              duplicatesBytes: m.duplicatesBytes + params.duplicatesFreedBytes,
              totalGainsBytes: m.totalGainsBytes + totalFreedImmediate,
              runsCount: m.runsCount + 1
            }
          : m
      )
    );

    // 5. Add run record
    const newRun: HousekeepRun = {
      id: `run-${Date.now()}`,
      runDate: new Date().toISOString(),
      weekNumber: 2,
      monthName: 'November',
      year: 2026,
      folderName: params.folderName,
      imagesCount: params.moveImageIds.length,
      imagesSizeBytes: images
        .filter((i) => params.moveImageIds.includes(i.id))
        .reduce((s, i) => s + i.sizeBytes, 0),
      appsUninstalledCount: params.uninstallAppIds.length,
      appsFreedBytes: appsFreed,
      cacheFreedBytes: params.cacheFreedBytes,
      duplicatesFreedBytes: params.duplicatesFreedBytes,
      totalFreedBytes: totalFreedImmediate,
      status: 'completed',
      hardDiskBackupConfirmed: false
    };

    setHousekeepRuns((prev) => [newRun, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Bar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScan={() => setIsScanModalOpen(true)}
        onOpenHardDiskModal={() => setIsHardDiskModalOpen(true)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        dormantAppsCount={dormantAppsCount}
        unarchivedImagesCount={unarchivedImages.length}
        pendingDownloadsCount={pendingDownloads.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
        {/* View Mode Switcher for Desktop Preview */}
        <div className="hidden lg:flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">View Mode:</span>
            <span className="text-slate-500">
              Preview this utility as an expanded multi-column dashboard or inside an interactive smartphone shell.
            </span>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode('responsive')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'responsive'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Full Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode('phone_shell')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'phone_shell'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Shell View</span>
            </button>
          </div>
        </div>

        {/* View container: either standard full-width responsive or simulated phone frame */}
        <div className={viewMode === 'phone_shell' ? 'max-w-md mx-auto border-8 border-slate-800 dark:border-slate-700 rounded-[40px] shadow-2xl p-4 bg-white dark:bg-slate-900 overflow-hidden' : 'space-y-6'}>
          {/* PWA Manifestation Banner with HK branding */}
          <PWAInstallBanner />

          {/* Top Storage Overview Bar (Always visible or in Housekeep) */}
          <StorageOverviewCard
            storage={storage}
            reclaimableBytes={reclaimableBytes}
            unarchivedImagesBytes={unarchivedImagesBytes}
            dormantAppsBytes={dormantAppsBytes}
            onRunScan={() => setIsScanModalOpen(true)}
            onOpenHardDiskModal={() => setIsHardDiskModalOpen(true)}
            onViewDormantApps={() => setActiveTab('dormant_apps')}
          />

          {/* Section 1: Weekly Housekeep Home / Overview */}
          {activeTab === 'housekeep' && (
            <div className="space-y-6">
              {/* Smart Preview Feature powered by Gemini AI */}
              <SmartPreviewCard
                images={images}
                apps={apps}
                currentWeekFolder={generateHousekeepFolderName(new Date(), folderSettings.namingTemplate, folderSettings.prefixFolder)}
                onMoveImageToHousekeep={handleMoveSingleImageToHousekeep}
                onUninstallApp={handleUninstallApp}
                onCleanBatch={handleCleanBatchSmartPreview}
              />

              {/* Quick Jump Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: DCIM Housekeeping */}
                <div
                  onClick={() => setActiveTab('dcim')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FolderArchive className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      {formatBytes(unarchivedImagesBytes)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Weekly DCIM Housekeeping
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {unarchivedImages.length} camera photos ready for{' '}
                    <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                      {generateHousekeepFolderName(new Date(), folderSettings.namingTemplate, folderSettings.prefixFolder)}
                    </code>
                  </p>
                </div>

                {/* Card 2: Download Archive (WhatsApp, Telegram, Downloads) */}
                <div
                  onClick={() => setActiveTab('download_archive')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Film className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded">
                      {formatBytes(pendingDownloadsBytes)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Download Archive
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {pendingDownloads.length} WhatsApp, Telegram &amp; movie downloads for{' '}
                    <code className="text-purple-600 dark:text-purple-400 font-mono text-[11px]">
                      {generateDownloadArchiveFolderName(new Date(), folderSettings.namingTemplate)}
                    </code>
                  </p>
                </div>

                {/* Card 3: Dormant Apps */}
                <div
                  onClick={() => setActiveTab('dormant_apps')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                      {formatBytes(dormantAppsBytes)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    Inactive Apps (&gt; 30 Days)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {dormantAppsCount} apps unlaunched in 30+ days. Uninstall to reclaim internal storage.
                  </p>
                </div>

                {/* Card 4: 6-Month Gains */}
                <div
                  onClick={() => setActiveTab('report')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      +{formatBytes(monthlyGains.reduce((s, m) => s + m.totalGainsBytes, 0), 1)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    6-Month Storage Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Interactive bar chart showing monthly storage gains across DCIM offloading and app removals.
                  </p>
                </div>
              </div>

              {/* Storage Tips Section powered by Gemini AI */}
              <StorageTipsCard
                storage={storage}
                images={images}
                apps={apps}
                monthlyGains={monthlyGains}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />

              {/* DCIM Housekeeper component */}
              <DCIMHousekeeper
                images={images}
                folderSettings={folderSettings}
                onUpdateFolderSettings={setFolderSettings}
                onMoveImagesToHousekeep={handleMoveImagesToHousekeep}
                onConfirmHardDiskBackup={handleConfirmHardDiskBackup}
                onFreePhoneSpace={handleFreePhoneSpace}
                onAddSamplePhoto={handleAddSamplePhoto}
              />
            </div>
          )}

          {/* Section 2: Download Archive (WhatsApp, Telegram & Downloads) */}
          {activeTab === 'download_archive' && (
            <DownloadArchiveManager
              images={images}
              folderSettings={folderSettings}
              onArchiveMediaToDownloadArchive={handleArchiveMediaToDownloadArchive}
              onConfirmHardDiskBackup={handleConfirmHardDiskBackup}
              onFreePhoneSpace={handleFreePhoneSpace}
              onAddSampleDownload={handleAddSampleDownload}
            />
          )}

          {/* Section 3: Dormant Apps View */}
          {activeTab === 'dormant_apps' && (
            <DormantAppsManager
              apps={apps}
              onUninstallApp={handleUninstallApp}
              onBatchUninstall={handleBatchUninstall}
              onRestoreApp={handleRestoreApp}
            />
          )}

          {/* Section 4: DCIM Folders View */}
          {activeTab === 'dcim' && (
            <DCIMHousekeeper
              images={images}
              folderSettings={folderSettings}
              onUpdateFolderSettings={setFolderSettings}
              onMoveImagesToHousekeep={handleMoveImagesToHousekeep}
              onConfirmHardDiskBackup={handleConfirmHardDiskBackup}
              onFreePhoneSpace={handleFreePhoneSpace}
              onAddSamplePhoto={handleAddSamplePhoto}
            />
          )}

          {/* Section 5: 6-Month Report View */}
          {activeTab === 'report' && (
            <SixMonthReportChart
              monthlyGains={monthlyGains}
              housekeepRuns={housekeepRuns}
            />
          )}

          {/* Section 6: Schedule & Settings View */}
          {activeTab === 'settings' && (
            <WeeklyScheduleCard
              settings={folderSettings}
              onSaveSettings={setFolderSettings}
              onTriggerManualRun={() => setIsScanModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Thumb Bar */}
      <BottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dormantAppsCount={dormantAppsCount}
        unarchivedImagesCount={unarchivedImages.length}
        pendingDownloadsCount={pendingDownloads.length}
      />

      {/* Modals */}
      <WeeklyScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        images={images}
        apps={apps}
        folderSettings={folderSettings}
        onApplyHousekeeping={handleApplyWeeklyHousekeeping}
      />

      <HardDiskConnectModal
        isOpen={isHardDiskModalOpen}
        onClose={() => setIsHardDiskModalOpen(false)}
        stagedImages={stagedImages}
        folderSettings={folderSettings}
        onBackupSuccess={handleConfirmHardDiskBackup}
      />
    </div>
  );
}
