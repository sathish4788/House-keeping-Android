import { DCIMImage, InstalledApp, HousekeepRun, MonthlyStorageGain, StorageDeviceStatus, HousekeepFolderSettings } from '../types';

// Helper to create reliable SVG thumbnail representations
function createPhotoThumbnail(title: string, color1: string, color2: string, iconType: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
    <defs>
      <linearGradient id="g_${encodeURIComponent(title)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g_${encodeURIComponent(title)})" rx="8"/>
    <circle cx="150" cy="85" r="32" fill="rgba(255,255,255,0.18)"/>
    <text x="150" y="93" font-family="sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">${iconType}</text>
    <text x="150" y="145" font-family="sans-serif" font-size="13" font-weight="600" fill="#ffffff" text-anchor="middle">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_FOLDER_SETTINGS: HousekeepFolderSettings = {
  namingTemplate: 'YYYY_Mon_Week_N',
  prefixFolder: 'housekeep',
  targetCameraSubfolder: 'DCIM',
  autoArchiveAgeDays: 7,
  scheduleDayOfWeek: 0, // Sunday
  scheduleHour: 2, // 2:00 AM
  autoNotify: true
};

export const INITIAL_STORAGE_STATUS: StorageDeviceStatus = {
  totalCapacityBytes: 128 * 1024 * 1024 * 1024, // 128 GB
  usedBytes: 104.4 * 1024 * 1024 * 1024, // 104.4 GB used (81.5%)
  freeBytes: 23.6 * 1024 * 1024 * 1024, // 23.6 GB free
  systemBytes: 18.5 * 1024 * 1024 * 1024, // 18.5 GB
  dcimBytes: 42.8 * 1024 * 1024 * 1024, // 42.8 GB
  appsBytes: 31.2 * 1024 * 1024 * 1024, // 31.2 GB
  otherBytes: 11.9 * 1024 * 1024 * 1024  // 11.9 GB
};

export const INITIAL_DCIM_IMAGES: DCIMImage[] = [
  {
    id: 'img-101',
    name: 'IMG_20261108_142010.jpg',
    dateTaken: '2026-11-08T14:20:10Z',
    sizeBytes: 8.4 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Weekend Hike Peak', '#0f766e', '#134e4a', '⛰️'),
    width: 4032,
    height: 3024,
    status: 'in_dcim'
  },
  {
    id: 'img-102',
    name: 'IMG_20261108_142012.jpg',
    dateTaken: '2026-11-08T14:20:12Z',
    sizeBytes: 8.2 * 1024 * 1024,
    category: 'duplicate',
    thumbnailUrl: createPhotoThumbnail('Hike Burst #2', '#0f766e', '#042f2e', '📸'),
    width: 4032,
    height: 3024,
    status: 'in_dcim'
  },
  {
    id: 'img-103',
    name: 'IMG_20261107_193400.jpg',
    dateTaken: '2026-11-07T19:34:00Z',
    sizeBytes: 6.9 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Dinner Night Out', '#7c2d12', '#451a03', '🍽️'),
    width: 4032,
    height: 3024,
    status: 'in_dcim'
  },
  {
    id: 'img-104',
    name: 'VID_20261106_161520.mp4',
    dateTaken: '2026-11-06T16:15:20Z',
    sizeBytes: 420 * 1024 * 1024, // 420 MB 4K Video
    category: 'large_video',
    thumbnailUrl: createPhotoThumbnail('Cat 4K 60fps Clip', '#4c1d95', '#2e1065', '🎥'),
    width: 3840,
    height: 2160,
    status: 'in_dcim'
  },
  {
    id: 'img-105',
    name: 'Screenshot_20261105-0914.png',
    dateTaken: '2026-11-05T09:14:00Z',
    sizeBytes: 3.8 * 1024 * 1024,
    category: 'screenshot',
    thumbnailUrl: createPhotoThumbnail('Flight Confirmation', '#1e3a8a', '#172554', '📱'),
    width: 1080,
    height: 2400,
    status: 'in_dcim'
  },
  {
    id: 'img-106',
    name: 'IMG_20261104_110245.jpg',
    dateTaken: '2026-11-04T11:02:45Z',
    sizeBytes: 12.1 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Botanical Garden', '#15803d', '#14532d', '🌿'),
    width: 4032,
    height: 3024,
    status: 'in_dcim'
  },
  {
    id: 'img-107',
    name: 'IMG_20261104_110246.jpg',
    dateTaken: '2026-11-04T11:02:46Z',
    sizeBytes: 11.9 * 1024 * 1024,
    category: 'duplicate',
    thumbnailUrl: createPhotoThumbnail('Garden Burst #2', '#15803d', '#052e16', '📸'),
    width: 4032,
    height: 3024,
    status: 'in_dcim'
  },
  {
    id: 'img-108',
    name: 'IMG_20261103_084512.jpg',
    dateTaken: '2026-11-03T08:45:12Z',
    sizeBytes: 9.3 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Morning Coffee Shop', '#9a3412', '#7c2d12', '☕'),
    width: 4032,
    height: 3024,
    status: 'in_dcim'
  },
  {
    id: 'img-109',
    name: 'VID_20261102_173000.mp4',
    dateTaken: '2026-11-02T17:30:00Z',
    sizeBytes: 310 * 1024 * 1024, // 310 MB Video
    category: 'large_video',
    thumbnailUrl: createPhotoThumbnail('Drone Sunset Bay', '#0369a1', '#082f49', '🌅'),
    width: 3840,
    height: 2160,
    status: 'in_dcim'
  },
  {
    id: 'img-110',
    name: 'Screenshot_20261102-1400.png',
    dateTaken: '2026-11-02T14:00:00Z',
    sizeBytes: 2.9 * 1024 * 1024,
    category: 'screenshot',
    thumbnailUrl: createPhotoThumbnail('Receipt Store Bill', '#334155', '#0f172a', '🧾'),
    width: 1080,
    height: 2400,
    status: 'in_dcim',
    source: 'dcim'
  },
  // WhatsApp Media
  {
    id: 'wa-vid-01',
    name: 'VID_WA_20261108_FamilyTrip.mp4',
    dateTaken: '2026-11-08T15:10:00Z',
    sizeBytes: 185 * 1024 * 1024,
    category: 'chat_video',
    thumbnailUrl: createPhotoThumbnail('WhatsApp Family Clip', '#059669', '#065f46', '💬'),
    width: 1920,
    height: 1080,
    status: 'in_dcim',
    source: 'whatsapp',
    mediaType: 'video',
    originalPath: '/WhatsApp/Media/WhatsApp Video/'
  },
  {
    id: 'wa-img-01',
    name: 'IMG_WA_20261107_GroupEvent.jpg',
    dateTaken: '2026-11-07T18:22:00Z',
    sizeBytes: 4.8 * 1024 * 1024,
    category: 'chat_image',
    thumbnailUrl: createPhotoThumbnail('WhatsApp Group Event', '#059669', '#047857', '📸'),
    width: 2560,
    height: 1920,
    status: 'in_dcim',
    source: 'whatsapp',
    mediaType: 'image',
    originalPath: '/WhatsApp/Media/WhatsApp Images/'
  },
  {
    id: 'wa-img-02',
    name: 'IMG_WA_20261105_Infographic.jpg',
    dateTaken: '2026-11-05T12:00:00Z',
    sizeBytes: 3.6 * 1024 * 1024,
    category: 'chat_image',
    thumbnailUrl: createPhotoThumbnail('WhatsApp Chart Note', '#059669', '#064e3b', '📊'),
    width: 1080,
    height: 2340,
    status: 'in_dcim',
    source: 'whatsapp',
    mediaType: 'image',
    originalPath: '/WhatsApp/Media/WhatsApp Images/'
  },
  // Telegram Media
  {
    id: 'tg-vid-01',
    name: 'TG_Video_20261107_TechDoc.mp4',
    dateTaken: '2026-11-07T21:40:00Z',
    sizeBytes: 540 * 1024 * 1024,
    category: 'chat_video',
    thumbnailUrl: createPhotoThumbnail('Telegram Tech Doc', '#0284c7', '#0369a1', '✈️'),
    width: 1920,
    height: 1080,
    status: 'in_dcim',
    source: 'telegram',
    mediaType: 'video',
    originalPath: '/Telegram/Telegram Video/'
  },
  {
    id: 'tg-img-01',
    name: 'TG_Image_20261106_DesignWallpaper.jpg',
    dateTaken: '2026-11-06T14:10:00Z',
    sizeBytes: 8.5 * 1024 * 1024,
    category: 'chat_image',
    thumbnailUrl: createPhotoThumbnail('Telegram Wallpaper', '#0284c7', '#075985', '🖼️'),
    width: 3840,
    height: 2160,
    status: 'in_dcim',
    source: 'telegram',
    mediaType: 'image',
    originalPath: '/Telegram/Telegram Images/'
  },
  // Downloads Folder (Movies & Large files)
  {
    id: 'dl-mov-01',
    name: 'Movie_SciFi_Indie_Short_2026.mp4',
    dateTaken: '2026-11-06T20:15:00Z',
    sizeBytes: 850 * 1024 * 1024,
    category: 'downloaded_movie',
    thumbnailUrl: createPhotoThumbnail('Downloaded 1080p Movie', '#7c3aed', '#5b21b6', '🎬'),
    width: 1920,
    height: 1080,
    status: 'in_dcim',
    source: 'downloads',
    mediaType: 'movie',
    originalPath: '/Download/Movies/'
  },
  {
    id: 'dl-vid-02',
    name: 'Tutorial_FullStack_Offline2026.mp4',
    dateTaken: '2026-11-04T16:30:00Z',
    sizeBytes: 420 * 1024 * 1024,
    category: 'downloaded_movie',
    thumbnailUrl: createPhotoThumbnail('Downloaded Tech Tutorial', '#7c3aed', '#4c1d95', '💻'),
    width: 1920,
    height: 1080,
    status: 'in_dcim',
    source: 'downloads',
    mediaType: 'movie',
    originalPath: '/Download/'
  },
  {
    id: 'dl-img-01',
    name: 'Downloaded_Catalog_Brochure.jpg',
    dateTaken: '2026-11-03T10:00:00Z',
    sizeBytes: 14.2 * 1024 * 1024,
    category: 'chat_image',
    thumbnailUrl: createPhotoThumbnail('Downloaded Product Catalog', '#6b21a8', '#581c87', '📑'),
    width: 3000,
    height: 4000,
    status: 'in_dcim',
    source: 'downloads',
    mediaType: 'image',
    originalPath: '/Download/'
  },
  // Week 1 Photos already staged or previously archived
  {
    id: 'img-111',
    name: 'IMG_20261101_120530.jpg',
    dateTaken: '2026-11-01T12:05:30Z',
    sizeBytes: 7.6 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Art Museum Walk', '#be123c', '#881337', '🏛️'),
    width: 4032,
    height: 3024,
    status: 'staged_housekeep',
    housekeepFolder: 'housekeep/2026_Nov_Week_1'
  },
  {
    id: 'img-112',
    name: 'IMG_20261031_183020.jpg',
    dateTaken: '2026-10-31T18:30:20Z',
    sizeBytes: 10.4 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Halloween Lanterns', '#c2410c', '#7c2d12', '🎃'),
    width: 4032,
    height: 3024,
    status: 'staged_housekeep',
    housekeepFolder: 'housekeep/2026_Oct_Week_5'
  },
  {
    id: 'img-113',
    name: 'IMG_20261028_101511.jpg',
    dateTaken: '2026-10-28T10:15:11Z',
    sizeBytes: 8.8 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Autumn Trail Trees', '#b45309', '#78350f', '🍂'),
    width: 4032,
    height: 3024,
    status: 'backed_up_to_harddisk',
    housekeepFolder: 'housekeep/2026_Oct_Week_4',
    backedUpAt: '2026-11-01T09:00:00Z'
  },
  {
    id: 'img-114',
    name: 'IMG_20261025_164000.jpg',
    dateTaken: '2026-10-25T16:40:00Z',
    sizeBytes: 14.2 * 1024 * 1024,
    category: 'camera',
    thumbnailUrl: createPhotoThumbnail('Family Reunion', '#047857', '#064e3b', '👨‍👩‍👧‍👦'),
    width: 4032,
    height: 3024,
    status: 'backed_up_to_harddisk',
    housekeepFolder: 'housekeep/2026_Oct_Week_4',
    backedUpAt: '2026-11-01T09:00:00Z'
  }
];

export const INITIAL_INSTALLED_APPS: InstalledApp[] = [
  // Apps unused for > 30 days
  {
    id: 'app-01',
    name: 'Epic Realms 3D RPG',
    packageName: 'com.mythicgames.epicrealms',
    icon: '⚔️',
    category: 'Games',
    sizeBytes: 1.95 * 1024 * 1024 * 1024, // 1.95 GB
    dataSizeBytes: 720 * 1024 * 1024, // 720 MB
    cacheSizeBytes: 180 * 1024 * 1024, // 180 MB
    lastUsedDate: '2026-09-14T10:30:00Z', // ~56 days ago
    installedDate: '2026-03-12T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-02',
    name: 'SkyTravel Flight Tracker',
    packageName: 'com.skytravel.mobile',
    icon: '✈️',
    category: 'Travel',
    sizeBytes: 420 * 1024 * 1024, // 420 MB
    dataSizeBytes: 140 * 1024 * 1024, // 140 MB
    cacheSizeBytes: 65 * 1024 * 1024, // 65 MB
    lastUsedDate: '2026-09-28T08:15:00Z', // ~42 days ago
    installedDate: '2026-05-18T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-03',
    name: 'FitPulse Workout Pro',
    packageName: 'com.fitpulse.health',
    icon: '🏋️',
    category: 'Tools',
    sizeBytes: 580 * 1024 * 1024,
    dataSizeBytes: 210 * 1024 * 1024,
    cacheSizeBytes: 95 * 1024 * 1024,
    lastUsedDate: '2026-08-20T06:00:00Z', // ~81 days ago
    installedDate: '2026-01-10T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-04',
    name: 'Retro Arcade Classics',
    packageName: 'com.retroarcade.pixel',
    icon: '🕹️',
    category: 'Games',
    sizeBytes: 1.15 * 1024 * 1024 * 1024, // 1.15 GB
    dataSizeBytes: 220 * 1024 * 1024,
    cacheSizeBytes: 40 * 1024 * 1024,
    lastUsedDate: '2026-07-15T18:00:00Z', // ~117 days ago
    installedDate: '2025-11-20T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-05',
    name: 'LanguagePal Mandarin',
    packageName: 'com.langpal.chinese',
    icon: '🗣️',
    category: 'Productivity',
    sizeBytes: 680 * 1024 * 1024,
    dataSizeBytes: 310 * 1024 * 1024,
    cacheSizeBytes: 70 * 1024 * 1024,
    lastUsedDate: '2026-10-02T12:00:00Z', // ~38 days ago
    installedDate: '2026-04-05T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-06',
    name: 'ScanMaster OCR Scanner',
    packageName: 'com.scanmaster.pdfdoc',
    icon: '📄',
    category: 'Tools',
    sizeBytes: 240 * 1024 * 1024,
    dataSizeBytes: 85 * 1024 * 1024,
    cacheSizeBytes: 35 * 1024 * 1024,
    lastUsedDate: '2026-09-08T15:00:00Z', // ~62 days ago
    installedDate: '2026-02-14T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-07',
    name: 'FoodDrop Express',
    packageName: 'com.fooddrop.delivery',
    icon: '🍔',
    category: 'Shopping',
    sizeBytes: 310 * 1024 * 1024,
    dataSizeBytes: 120 * 1024 * 1024,
    cacheSizeBytes: 110 * 1024 * 1024,
    lastUsedDate: '2026-08-04T19:30:00Z', // ~97 days ago
    installedDate: '2025-09-10T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-08',
    name: 'PhotoVibe Aesthetic Filters',
    packageName: 'com.photovibe.editor',
    icon: '🎨',
    category: 'Entertainment',
    sizeBytes: 890 * 1024 * 1024,
    dataSizeBytes: 190 * 1024 * 1024,
    cacheSizeBytes: 140 * 1024 * 1024,
    lastUsedDate: '2026-06-25T21:00:00Z', // ~137 days ago
    installedDate: '2025-10-15T00:00:00Z',
    isSystemApp: false
  },
  // Recently active apps (< 30 days)
  {
    id: 'app-09',
    name: 'WhatsApp Messenger',
    packageName: 'com.whatsapp',
    icon: '💬',
    category: 'Social',
    sizeBytes: 1.4 * 1024 * 1024 * 1024,
    dataSizeBytes: 2.8 * 1024 * 1024 * 1024,
    cacheSizeBytes: 420 * 1024 * 1024,
    lastUsedDate: '2026-11-09T14:15:00Z', // Today
    installedDate: '2024-01-01T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-10',
    name: 'Spotify Music & Podcasts',
    packageName: 'com.spotify.music',
    icon: '🎵',
    category: 'Entertainment',
    sizeBytes: 980 * 1024 * 1024,
    dataSizeBytes: 2.4 * 1024 * 1024 * 1024, // Offline downloads
    cacheSizeBytes: 520 * 1024 * 1024,
    lastUsedDate: '2026-11-08T18:00:00Z', // 1 day ago
    installedDate: '2024-02-15T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-11',
    name: 'Chrome Browser',
    packageName: 'com.android.chrome',
    icon: '🌐',
    category: 'Tools',
    sizeBytes: 740 * 1024 * 1024,
    dataSizeBytes: 650 * 1024 * 1024,
    cacheSizeBytes: 850 * 1024 * 1024,
    lastUsedDate: '2026-11-09T11:00:00Z', // Today
    installedDate: '2024-01-01T00:00:00Z',
    isSystemApp: true // System app
  },
  {
    id: 'app-12',
    name: 'Camera & System Gallery',
    packageName: 'com.google.android.GoogleCamera',
    icon: '📷',
    category: 'Tools',
    sizeBytes: 380 * 1024 * 1024,
    dataSizeBytes: 120 * 1024 * 1024,
    cacheSizeBytes: 140 * 1024 * 1024,
    lastUsedDate: '2026-11-08T14:20:00Z',
    installedDate: '2024-01-01T00:00:00Z',
    isSystemApp: true
  },
  {
    id: 'app-13',
    name: 'Slack Work Chat',
    packageName: 'com.Slack',
    icon: '💼',
    category: 'Productivity',
    sizeBytes: 520 * 1024 * 1024,
    dataSizeBytes: 890 * 1024 * 1024,
    cacheSizeBytes: 310 * 1024 * 1024,
    lastUsedDate: '2026-11-07T16:00:00Z', // 2 days ago
    installedDate: '2024-03-20T00:00:00Z',
    isSystemApp: false
  },
  {
    id: 'app-14',
    name: 'CityMaps & Transit',
    packageName: 'com.citymaps.nav',
    icon: '🗺️',
    category: 'Travel',
    sizeBytes: 410 * 1024 * 1024,
    dataSizeBytes: 540 * 1024 * 1024,
    cacheSizeBytes: 190 * 1024 * 1024,
    lastUsedDate: '2026-11-04T09:00:00Z', // 5 days ago
    installedDate: '2024-06-11T00:00:00Z',
    isSystemApp: false
  }
];

export const INITIAL_MONTHLY_GAINS: MonthlyStorageGain[] = [
  {
    month: 'Jun 2026',
    monthShort: 'Jun',
    year: 2026,
    monthIndex: 5,
    dcimPhotosBytes: 4.2 * 1024 * 1024 * 1024, // 4.2 GB
    dormantAppsBytes: 1.8 * 1024 * 1024 * 1024, // 1.8 GB
    cacheTempBytes: 0.9 * 1024 * 1024 * 1024,   // 0.9 GB
    duplicatesBytes: 0.6 * 1024 * 1024 * 1024,  // 0.6 GB
    totalGainsBytes: 7.5 * 1024 * 1024 * 1024,  // 7.5 GB
    runsCount: 4
  },
  {
    month: 'Jul 2026',
    monthShort: 'Jul',
    year: 2026,
    monthIndex: 6,
    dcimPhotosBytes: 5.1 * 1024 * 1024 * 1024,
    dormantAppsBytes: 1.4 * 1024 * 1024 * 1024,
    cacheTempBytes: 1.2 * 1024 * 1024 * 1024,
    duplicatesBytes: 0.8 * 1024 * 1024 * 1024,
    totalGainsBytes: 8.5 * 1024 * 1024 * 1024,
    runsCount: 5
  },
  {
    month: 'Aug 2026',
    monthShort: 'Aug',
    year: 2026,
    monthIndex: 7,
    dcimPhotosBytes: 3.8 * 1024 * 1024 * 1024,
    dormantAppsBytes: 0.9 * 1024 * 1024 * 1024,
    cacheTempBytes: 0.8 * 1024 * 1024 * 1024,
    duplicatesBytes: 0.5 * 1024 * 1024 * 1024,
    totalGainsBytes: 6.0 * 1024 * 1024 * 1024,
    runsCount: 4
  },
  {
    month: 'Sep 2026',
    monthShort: 'Sep',
    year: 2026,
    monthIndex: 8,
    dcimPhotosBytes: 5.8 * 1024 * 1024 * 1024,
    dormantAppsBytes: 2.2 * 1024 * 1024 * 1024,
    cacheTempBytes: 1.1 * 1024 * 1024 * 1024,
    duplicatesBytes: 0.7 * 1024 * 1024 * 1024,
    totalGainsBytes: 9.8 * 1024 * 1024 * 1024,
    runsCount: 4
  },
  {
    month: 'Oct 2026',
    monthShort: 'Oct',
    year: 2026,
    monthIndex: 9,
    dcimPhotosBytes: 4.6 * 1024 * 1024 * 1024,
    dormantAppsBytes: 1.6 * 1024 * 1024 * 1024,
    cacheTempBytes: 0.95 * 1024 * 1024 * 1024,
    duplicatesBytes: 0.65 * 1024 * 1024 * 1024,
    totalGainsBytes: 7.8 * 1024 * 1024 * 1024,
    runsCount: 4
  },
  {
    month: 'Nov 2026',
    monthShort: 'Nov',
    year: 2026,
    monthIndex: 10,
    dcimPhotosBytes: 2.4 * 1024 * 1024 * 1024,
    dormantAppsBytes: 0.8 * 1024 * 1024 * 1024,
    cacheTempBytes: 0.5 * 1024 * 1024 * 1024,
    duplicatesBytes: 0.3 * 1024 * 1024 * 1024,
    totalGainsBytes: 4.0 * 1024 * 1024 * 1024, // current partial month
    runsCount: 2
  }
];

export const INITIAL_HOUSEKEEP_RUNS: HousekeepRun[] = [
  {
    id: 'run-01',
    runDate: '2026-11-02T02:00:00Z',
    weekNumber: 1,
    monthName: 'November',
    year: 2026,
    folderName: 'housekeep/2026_Nov_Week_1',
    imagesCount: 48,
    imagesSizeBytes: 2.1 * 1024 * 1024 * 1024,
    appsUninstalledCount: 1,
    appsFreedBytes: 820 * 1024 * 1024,
    cacheFreedBytes: 450 * 1024 * 1024,
    duplicatesFreedBytes: 320 * 1024 * 1024,
    totalFreedBytes: 3.69 * 1024 * 1024 * 1024,
    status: 'completed',
    hardDiskBackupConfirmed: true,
    targetDriveName: 'SanDisk Extreme 1TB'
  },
  {
    id: 'run-02',
    runDate: '2026-10-26T02:00:00Z',
    weekNumber: 4,
    monthName: 'October',
    year: 2026,
    folderName: 'housekeep/2026_Oct_Week_4',
    imagesCount: 62,
    imagesSizeBytes: 2.4 * 1024 * 1024 * 1024,
    appsUninstalledCount: 2,
    appsFreedBytes: 1.1 * 1024 * 1024 * 1024,
    cacheFreedBytes: 380 * 1024 * 1024,
    duplicatesFreedBytes: 240 * 1024 * 1024,
    totalFreedBytes: 4.12 * 1024 * 1024 * 1024,
    status: 'completed',
    hardDiskBackupConfirmed: true,
    targetDriveName: 'WD My Passport 2TB'
  },
  {
    id: 'run-03',
    runDate: '2026-10-19T02:00:00Z',
    weekNumber: 3,
    monthName: 'October',
    year: 2026,
    folderName: 'housekeep/2026_Oct_Week_3',
    imagesCount: 39,
    imagesSizeBytes: 1.7 * 1024 * 1024 * 1024,
    appsUninstalledCount: 0,
    appsFreedBytes: 0,
    cacheFreedBytes: 290 * 1024 * 1024,
    duplicatesFreedBytes: 180 * 1024 * 1024,
    totalFreedBytes: 2.17 * 1024 * 1024 * 1024,
    status: 'completed',
    hardDiskBackupConfirmed: true,
    targetDriveName: 'Samsung T7 Shield 1TB'
  },
  {
    id: 'run-04',
    runDate: '2026-10-12T02:00:00Z',
    weekNumber: 2,
    monthName: 'October',
    year: 2026,
    folderName: 'housekeep/2026_Oct_Week_2',
    imagesCount: 54,
    imagesSizeBytes: 2.2 * 1024 * 1024 * 1024,
    appsUninstalledCount: 1,
    appsFreedBytes: 650 * 1024 * 1024,
    cacheFreedBytes: 310 * 1024 * 1024,
    duplicatesFreedBytes: 210 * 1024 * 1024,
    totalFreedBytes: 3.37 * 1024 * 1024 * 1024,
    status: 'completed',
    hardDiskBackupConfirmed: true,
    targetDriveName: 'SanDisk Extreme 1TB'
  }
];
