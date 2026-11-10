export interface DCIMImage {
  id: string;
  name: string;
  dateTaken: string; // ISO format
  sizeBytes: number;
  category: 'camera' | 'screenshot' | 'burst' | 'duplicate' | 'large_video' | 'chat_image' | 'chat_video' | 'downloaded_movie';
  thumbnailUrl: string;
  width: number;
  height: number;
  status: 'in_dcim' | 'staged_housekeep' | 'backed_up_to_harddisk';
  housekeepFolder?: string; // e.g. "housekeep/2026_Nov_Week_2" or "download_archive/2026_Nov_Week_2"
  backedUpAt?: string;
  source?: 'dcim' | 'whatsapp' | 'telegram' | 'downloads';
  mediaType?: 'image' | 'movie' | 'video';
  originalPath?: string;
}

export interface InstalledApp {
  id: string;
  name: string;
  packageName: string;
  icon: string; // icon identifier or SVG
  category: 'Games' | 'Social' | 'Productivity' | 'Shopping' | 'Travel' | 'Tools' | 'Entertainment';
  sizeBytes: number; // base app size
  dataSizeBytes: number; // user data
  cacheSizeBytes: number; // cache
  lastUsedDate: string; // ISO format
  installedDate: string;
  isSystemApp: boolean;
  uninstalled?: boolean;
  uninstalledAt?: string;
}

export interface HousekeepRun {
  id: string;
  runDate: string;
  weekNumber: number;
  monthName: string;
  year: number;
  folderName: string; // e.g. "housekeep/2026_Nov_Week_2"
  imagesCount: number;
  imagesSizeBytes: number;
  appsUninstalledCount: number;
  appsFreedBytes: number;
  cacheFreedBytes: number;
  duplicatesFreedBytes: number;
  totalFreedBytes: number;
  status: 'completed' | 'pending_backup' | 'scheduled';
  hardDiskBackupConfirmed: boolean;
  targetDriveName?: string;
}

export interface MonthlyStorageGain {
  month: string; // "Jun 2026"
  monthShort: string; // "Jun"
  year: number;
  monthIndex: number; // 0-11
  dcimPhotosBytes: number;
  dormantAppsBytes: number;
  cacheTempBytes: number;
  duplicatesBytes: number;
  totalGainsBytes: number;
  runsCount: number;
}

export interface StorageDeviceStatus {
  totalCapacityBytes: number;
  usedBytes: number;
  freeBytes: number;
  systemBytes: number;
  dcimBytes: number;
  appsBytes: number;
  otherBytes: number;
}

export interface HousekeepFolderSettings {
  namingTemplate: 'YYYY_Mon_Week_N' | 'Mon_Week_N' | 'Week_N_Mon_YYYY' | 'YYYY-Www';
  prefixFolder: string; // default "housekeep"
  targetCameraSubfolder: string; // default "DCIM"
  autoArchiveAgeDays: number; // e.g. 7 days
  scheduleDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  scheduleHour: number; // 24-hr format, e.g. 2 for 2:00 AM
  autoNotify: boolean;
}

export interface StorageTip {
  id: string;
  title: string;
  habit: string;
  impact: string;
  category: 'dcim_video' | 'dormant_apps' | 'burst_cleanup' | 'cache_hygiene' | 'housekeep_cadence' | 'download_archive';
  actionText: string;
  actionTab: 'dcim' | 'dormant_apps' | 'housekeep' | 'download_archive';
  estimatedSavingsBytes?: number;
}

export interface AIStorageTipsResponse {
  headline: string;
  comparisonInsight: string;
  tips: StorageTip[];
}

export interface SmartPreviewSuggestion {
  id: string;
  targetId: string;
  name: string;
  type: 'file' | 'app';
  sizeBytes: number;
  impactBadge: string;
  aiRationale: string;
  actionType: 'move_to_housekeep' | 'uninstall_app' | 'clean_duplicate';
  actionLabel: string;
}

export interface SmartPreviewResponse {
  summaryHeadline: string;
  totalReclaimableBytes: number;
  smartSuggestions: SmartPreviewSuggestion[];
}


