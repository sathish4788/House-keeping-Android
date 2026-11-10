import JSZip from 'jszip';
import { DCIMImage } from '../types';

/**
 * Creates SVG placeholder dummy image blobs for realistic file packaging
 */
function createDummyImageBlob(image: DCIMImage): Blob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}" viewBox="0 0 ${image.width} ${image.height}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="45%" font-family="sans-serif" font-size="28" font-weight="bold" fill="#38bdf8" text-anchor="middle">${image.name}</text>
    <text x="50%" y="55%" font-family="sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">Date: ${image.dateTaken.split('T')[0]}</text>
    <text x="50%" y="65%" font-family="monospace" font-size="14" fill="#64748b" text-anchor="middle">HousekeepOS Backup - ${image.housekeepFolder || 'DCIM'}</text>
  </svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * Generates and downloads a ZIP package matching the exact housekeep folder path
 * e.g. DCIM/housekeep/2026_Nov_Week_2/IMG_20261102_001.jpg
 */
export async function downloadHousekeepZip(
  folderPath: string,
  images: DCIMImage[],
  onProgress?: (percent: number, currentFile: string) => void
): Promise<void> {
  const zip = new JSZip();
  const manifest = {
    backupDate: new Date().toISOString(),
    housekeepFolder: folderPath,
    totalFiles: images.length,
    totalSizeBytes: images.reduce((acc, i) => acc + i.sizeBytes, 0),
    sourceDirectory: '/DCIM/Camera',
    targetHardDiskDestination: 'External Hard Drive / Housekeep Archive',
    files: images.map(img => ({
      name: img.name,
      dateTaken: img.dateTaken,
      sizeBytes: img.sizeBytes,
      category: img.category
    }))
  };

  // Add manifest info file
  zip.file(`${folderPath}/_backup_manifest.json`, JSON.stringify(manifest, null, 2));

  // Add images to folder
  for (let idx = 0; idx < images.length; idx++) {
    const img = images[idx];
    if (onProgress) {
      onProgress(Math.round(((idx + 1) / images.length) * 80), img.name);
    }
    const blob = createDummyImageBlob(img);
    zip.file(`${folderPath}/${img.name}`, blob);
  }

  if (onProgress) onProgress(90, 'Compressing archive...');

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  }, (metadata) => {
    if (onProgress) {
      onProgress(90 + Math.round(metadata.percent * 0.1), 'Packaging zip...');
    }
  });

  // Trigger download
  const safeName = folderPath.replace(/[/\\?%*:|"<>]/g, '_');
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Direct file write to external hard disk / USB drive using File System Access API
 */
export async function writeDirectToDirectoryPicker(
  folderPath: string,
  images: DCIMImage[],
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ success: boolean; driveName?: string; error?: string }> {
  try {
    // Check if showDirectoryPicker exists
    if (!('showDirectoryPicker' in window)) {
      return {
        success: false,
        error: 'File System Directory Picker is not supported in this browser. Please use the ZIP export option to transfer to your hard disk.'
      };
    }

    // @ts-expect-error - showDirectoryPicker is standard in modern Chromium
    const rootHandle = await window.showDirectoryPicker({
      id: 'housekeep-harddisk-target',
      mode: 'readwrite'
    });

    const folderParts = folderPath.split('/').filter(Boolean);
    let currentDirHandle = rootHandle;

    for (const part of folderParts) {
      currentDirHandle = await currentDirHandle.getDirectoryHandle(part, { create: true });
    }

    // Write manifest
    const manifestHandle = await currentDirHandle.getFileHandle('_backup_manifest.json', { create: true });
    const manifestWritable = await manifestHandle.createWritable();
    const manifestData = {
      backupDate: new Date().toISOString(),
      housekeepFolder: folderPath,
      totalFiles: images.length,
      totalSizeBytes: images.reduce((acc, i) => acc + i.sizeBytes, 0),
      destinationFolder: rootHandle.name
    };
    await manifestWritable.write(JSON.stringify(manifestData, null, 2));
    await manifestWritable.close();

    // Write files
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (onProgress) {
        onProgress(Math.round(((i + 1) / images.length) * 100), img.name);
      }
      const fileHandle = await currentDirHandle.getFileHandle(img.name, { create: true });
      const writable = await fileHandle.createWritable();
      const blob = createDummyImageBlob(img);
      await writable.write(blob);
      await writable.close();
    }

    return {
      success: true,
      driveName: rootHandle.name || 'External Hard Disk'
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'User cancelled directory selection' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during hard disk transfer'
    };
  }
}
