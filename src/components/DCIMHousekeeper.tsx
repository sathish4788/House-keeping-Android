import React, { useState } from 'react';
import {
  FolderArchive,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { DCIMImage, HousekeepFolderSettings } from '../types';
import { formatBytes, formatDateReadable, generateHousekeepFolderName } from '../utils/dateUtils';
import { downloadHousekeepZip, writeDirectToDirectoryPicker } from '../utils/zipExporter';

interface DCIMHousekeeperProps {
  images: DCIMImage[];
  folderSettings: HousekeepFolderSettings;
  onUpdateFolderSettings: (settings: HousekeepFolderSettings) => void;
  onMoveImagesToHousekeep: (imageIds: string[], folderName: string) => void;
  onConfirmHardDiskBackup: (folderName: string, driveName: string, freedBytes: number) => void;
  onFreePhoneSpace: (imageIds: string[], folderName: string) => void;
  onAddSamplePhoto: () => void;
}

export const DCIMHousekeeper: React.FC<DCIMHousekeeperProps> = ({
  images,
  folderSettings,
  onUpdateFolderSettings,
  onMoveImagesToHousekeep,
  onConfirmHardDiskBackup,
  onFreePhoneSpace,
  onAddSamplePhoto
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dcim' | 'staged' | 'archived'>('dcim');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [selectedStagedFolder, setSelectedStagedFolder] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; text: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Current calculated week & month folder name
  const currentWeekFolderName = generateHousekeepFolderName(
    new Date(),
    folderSettings.namingTemplate,
    folderSettings.prefixFolder
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Group images
  const inDcimImages = images.filter((img) => img.status === 'in_dcim');
  const stagedImages = images.filter((img) => img.status === 'staged_housekeep');
  const archivedImages = images.filter((img) => img.status === 'backed_up_to_harddisk');

  // Staged folders grouping
  const stagedFolderGroups = stagedImages.reduce<Record<string, DCIMImage[]>>((acc, img) => {
    const folder = img.housekeepFolder || currentWeekFolderName;
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(img);
    return acc;
  }, {});

  const displayedStagedImages =
    selectedStagedFolder === 'all'
      ? stagedImages
      : stagedImages.filter((img) => img.housekeepFolder === selectedStagedFolder);

  // Selection helpers
  const toggleSelectImage = (id: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllDcim = () => {
    if (selectedImageIds.length === inDcimImages.length) {
      setSelectedImageIds([]);
    } else {
      setSelectedImageIds(inDcimImages.map((i) => i.id));
    }
  };

  // Move to weekly folder
  const handleHousekeepSelected = () => {
    const targetIds = selectedImageIds.length > 0 ? selectedImageIds : inDcimImages.map((i) => i.id);
    if (targetIds.length === 0) return;

    onMoveImagesToHousekeep(targetIds, currentWeekFolderName);
    setSelectedImageIds([]);
    showToast(`Moved ${targetIds.length} images to ${currentWeekFolderName}`);
    setActiveSubTab('staged');
  };

  // Export to Hard Disk via Directory Picker
  const handleDirectHardDiskExport = async (folderName: string, folderImages: DCIMImage[]) => {
    setIsExporting(true);
    setExportProgress({ percent: 10, text: 'Opening file system directory picker...' });

    const result = await writeDirectToDirectoryPicker(folderName, folderImages, (percent, text) => {
      setExportProgress({ percent, text });
    });

    setIsExporting(false);
    setExportProgress(null);

    if (result.success) {
      const freedBytes = folderImages.reduce((sum, img) => sum + img.sizeBytes, 0);
      onConfirmHardDiskBackup(folderName, result.driveName || 'External Hard Disk', freedBytes);
      showToast(`Exported ${folderImages.length} images directly to ${result.driveName}! You can now free phone storage.`);
    } else if (result.error && !result.error.includes('cancelled')) {
      showToast(`Notice: ${result.error}. Starting ZIP download fallback.`);
      await handleZipExport(folderName, folderImages);
    }
  };

  // Export to Hard Disk via ZIP archive
  const handleZipExport = async (folderName: string, folderImages: DCIMImage[]) => {
    setIsExporting(true);
    setExportProgress({ percent: 20, text: 'Packaging images into weekly folder structure...' });

    try {
      await downloadHousekeepZip(folderName, folderImages, (percent, text) => {
        setExportProgress({ percent, text });
      });
      const freedBytes = folderImages.reduce((sum, img) => sum + img.sizeBytes, 0);
      onConfirmHardDiskBackup(folderName, 'External Hard Disk (ZIP)', freedBytes);
      showToast(`Downloaded ${folderName}.zip for Hard Disk transfer!`);
    } catch {
      showToast('Error generating ZIP archive.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Free phone space for backed up folder
  const handlePurgeFolder = (folderName: string, folderImages: DCIMImage[]) => {
    const ids = folderImages.map((i) => i.id);
    onFreePhoneSpace(ids, folderName);
    showToast(`Freed ${formatBytes(folderImages.reduce((s, i) => s + i.sizeBytes, 0))} from phone storage!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Target Weekly Folder Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Current Housekeep Destination
              </span>
              <span aria-hidden="true">·</span>
              <span>Week & Month Formatter</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm md:text-base font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg w-fit">
              <FolderArchive className="w-4 h-4 text-indigo-500" />
              <span>/DCIM/{currentWeekFolderName}/</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weekly housekeeping moves photos here so you can backup this folder to your external hard drive and free up phone storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Folder Template Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <span className="text-slate-500 dark:text-slate-400 px-2">Style:</span>
              <select
                aria-label="Folder naming template"
                value={folderSettings.namingTemplate}
                onChange={(e) =>
                  onUpdateFolderSettings({
                    ...folderSettings,
                    namingTemplate: e.target.value as HousekeepFolderSettings['namingTemplate']
                  })
                }
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs px-2.5 py-1 rounded border-0 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="YYYY_Mon_Week_N">YYYY_Mon_Week_N (2026_Nov_Week_2)</option>
                <option value="Mon_Week_N">Mon_Week_N (Nov_Week_2)</option>
                <option value="Week_N_Mon_YYYY">Week_N_Mon_YYYY (Week_2_November_2026)</option>
                <option value="YYYY-Www">YYYY-Www (2026-W45-Nov)</option>
              </select>
            </div>

            <button
              onClick={onAddSamplePhoto}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate New Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtabs for DCIM Workflow */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          <button
            onClick={() => setActiveSubTab('dcim')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'dcim'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            In DCIM / Camera ({inDcimImages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('staged')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'staged'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Staged in Housekeep ({stagedImages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('archived')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'archived'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Freed & Backed Up ({archivedImages.length})
          </button>
        </div>

        {activeSubTab === 'dcim' && inDcimImages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllDcim}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              {selectedImageIds.length === inDcimImages.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleHousekeepSelected}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>
                Housekeep to {currentWeekFolderName.split('/')[1] || currentWeekFolderName} (
                {selectedImageIds.length > 0 ? selectedImageIds.length : inDcimImages.length})
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Subtab 1: In DCIM Active Photos */}
      {activeSubTab === 'dcim' && (
        <div className="space-y-4">
          {inDcimImages.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                All DCIM photos have been housekept!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No unorganized images remain in your main camera folder. Check the &quot;Staged in Housekeep&quot; tab to export to your hard disk.
              </p>
              <button
                onClick={onAddSamplePhoto}
                className="mt-4 px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg"
              >
                Simulate Camera Shot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {inDcimImages.map((image) => {
                const isSelected = selectedImageIds.includes(image.id);
                return (
                  <div
                    key={image.id}
                    onClick={() => toggleSelectImage(image.id)}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-600/30 dark:ring-indigo-500/50'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    } bg-white dark:bg-slate-900`}
                  >
                    <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative">
                      <img
                        src={image.thumbnailUrl}
                        alt={image.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-black/40 text-transparent hover:bg-black/60'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>
                      {/* Tag for category */}
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                        {formatBytes(image.sizeBytes)}
                      </span>
                    </div>

                    <div className="p-2.5">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {image.name}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>{formatDateReadable(image.dateTaken)}</span>
                        <span className="capitalize">{image.category.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Staged Weekly Housekeep Folders */}
      {activeSubTab === 'staged' && (
        <div className="space-y-6">
          {/* Folder group cards */}
          {Object.keys(stagedFolderGroups).length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FolderArchive className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No Staged Housekeep Folders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Move images from your DCIM camera folder into the weekly housekeep folder to prepare them for hard disk backup.
              </p>
              <button
                onClick={() => setActiveSubTab('dcim')}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Go to DCIM Photos
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(stagedFolderGroups).map(([folderName, folderImages]) => {
                const totalBytes = folderImages.reduce((sum, img) => sum + img.sizeBytes, 0);

                return (
                  <div
                    key={folderName}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <FolderArchive className="w-5 h-5 text-indigo-500" />
                          <h3 className="text-base font-semibold font-mono text-slate-900 dark:text-white">
                            /DCIM/{folderName}/
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{folderImages.length} images</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{formatBytes(totalBytes)}</span>
                          <span aria-hidden="true">·</span>
                          <span>Ready for Hard Disk Transfer</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          disabled={isExporting}
                          onClick={() => handleDirectHardDiskExport(folderName, folderImages)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Direct to Hard Disk</span>
                        </button>

                        <button
                          disabled={isExporting}
                          onClick={() => handleZipExport(folderName, folderImages)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Zip</span>
                        </button>

                        <button
                          onClick={() => handlePurgeFolder(folderName, folderImages)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Free Phone Space ({formatBytes(totalBytes)})</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar during Export */}
                    {isExporting && exportProgress && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-mono">
                          <span>{exportProgress.text}</span>
                          <span>{exportProgress.percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${exportProgress.percent}%` }}
                            className="h-full bg-indigo-600 transition-all duration-200"
                          />
                        </div>
                      </div>
                    )}

                    {/* Images preview row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {folderImages.map((img) => (
                        <div
                          key={img.id}
                          className="group relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40"
                        >
                          <div className="aspect-[4/3]">
                            <img
                              src={img.thumbnailUrl}
                              alt={img.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-1.5">
                            <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                              {img.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {formatBytes(img.sizeBytes)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Archived & Freed History */}
      {activeSubTab === 'archived' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Archived & Freed from Phone Storage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These images were safely transferred to your external hard drive and deleted from phone DCIM to reclaim space.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
              {formatBytes(archivedImages.reduce((s, i) => s + i.sizeBytes, 0))} Freed
            </span>
          </div>

          {archivedImages.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No archived images yet. Housekeep staged folders to your hard disk and free space to populate this list.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {archivedImages.map((img) => (
                <div key={img.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={img.thumbnailUrl}
                        alt={img.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        {img.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono">{img.housekeepFolder}</span>
                        <span aria-hidden="true">·</span>
                        <span>Freed on {formatDateReadable(img.backedUpAt || img.dateTaken)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      +{formatBytes(img.sizeBytes)} freed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
