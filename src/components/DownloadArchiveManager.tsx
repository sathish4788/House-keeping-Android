import React, { useState } from 'react';
import {
  FolderArchive,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  Plus,
  Video,
  Image as ImageIcon,
  Film,
  Send,
  MessageCircle,
  FileDown,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DCIMImage, HousekeepFolderSettings } from '../types';
import { formatBytes, formatDateReadable, generateDownloadArchiveFolderName } from '../utils/dateUtils';
import { downloadHousekeepZip, writeDirectToDirectoryPicker } from '../utils/zipExporter';

interface DownloadArchiveManagerProps {
  images: DCIMImage[];
  folderSettings: HousekeepFolderSettings;
  onArchiveMediaToDownloadArchive: (mediaIds: string[], folderName: string) => void;
  onConfirmHardDiskBackup: (folderName: string, driveName: string, freedBytes: number) => void;
  onFreePhoneSpace: (mediaIds: string[], folderName: string) => void;
  onAddSampleDownload: (source: 'whatsapp' | 'telegram' | 'downloads') => void;
}

export const DownloadArchiveManager: React.FC<DownloadArchiveManagerProps> = ({
  images,
  folderSettings,
  onArchiveMediaToDownloadArchive,
  onConfirmHardDiskBackup,
  onFreePhoneSpace,
  onAddSampleDownload
}) => {
  const [sourceFilter, setSourceFilter] = useState<'all' | 'whatsapp' | 'telegram' | 'downloads' | 'staged' | 'archived'>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'movie' | 'video' | 'image'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; text: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dated folder name: e.g. "download_archive/2026_Nov_Week_2"
  const currentArchiveFolder = generateDownloadArchiveFolderName(
    new Date(),
    folderSettings.namingTemplate
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chat & Download media items
  const nonDcimMedia = images.filter((img) => img.source && img.source !== 'dcim');
  const inPhoneMedia = nonDcimMedia.filter((img) => img.status === 'in_dcim');
  const stagedMedia = images.filter(
    (img) => img.status === 'staged_housekeep' && (img.housekeepFolder?.startsWith('download_archive') || img.source !== 'dcim')
  );
  const archivedMedia = images.filter(
    (img) => img.status === 'backed_up_to_harddisk' && (img.housekeepFolder?.startsWith('download_archive') || img.source !== 'dcim')
  );

  // Calculate totals per source
  const waBytes = inPhoneMedia.filter((m) => m.source === 'whatsapp').reduce((s, m) => s + m.sizeBytes, 0);
  const tgBytes = inPhoneMedia.filter((m) => m.source === 'telegram').reduce((s, m) => s + m.sizeBytes, 0);
  const dlBytes = inPhoneMedia.filter((m) => m.source === 'downloads').reduce((s, m) => s + m.sizeBytes, 0);
  const totalInPhoneBytes = inPhoneMedia.reduce((s, m) => s + m.sizeBytes, 0);

  // Filtered list
  const filteredMedia = (sourceFilter === 'staged'
    ? stagedMedia
    : sourceFilter === 'archived'
    ? archivedMedia
    : inPhoneMedia.filter((m) => {
        if (sourceFilter !== 'all' && m.source !== sourceFilter) return false;
        if (mediaTypeFilter === 'all') return true;
        if (mediaTypeFilter === 'movie' || mediaTypeFilter === 'video') {
          return m.category === 'downloaded_movie' || m.category === 'chat_video' || m.category === 'large_video';
        }
        return m.category === 'chat_image' || m.category === 'camera' || m.category === 'screenshot';
      }));

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredMedia.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMedia.map((m) => m.id));
    }
  };

  // Archive action
  const handleArchiveSelected = () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : inPhoneMedia.map((m) => m.id);
    if (targetIds.length === 0) return;

    onArchiveMediaToDownloadArchive(targetIds, currentArchiveFolder);
    setSelectedIds([]);
    showToast(`Archived ${targetIds.length} items to ${currentArchiveFolder}`);
    setSourceFilter('staged');
  };

  // Direct Hard Disk Write
  const handleDirectExport = async (folderName: string, items: DCIMImage[]) => {
    setIsExporting(true);
    setExportProgress({ percent: 10, text: 'Opening file system directory picker...' });

    const result = await writeDirectToDirectoryPicker(folderName, items, (percent, text) => {
      setExportProgress({ percent, text });
    });

    setIsExporting(false);
    setExportProgress(null);

    if (result.success) {
      const freedBytes = items.reduce((sum, img) => sum + img.sizeBytes, 0);
      onConfirmHardDiskBackup(folderName, result.driveName || 'External Hard Disk', freedBytes);
      showToast(`Exported ${items.length} items directly to ${result.driveName}! You can now free phone space.`);
    } else if (result.error && !result.error.includes('cancelled')) {
      showToast(`Notice: ${result.error}. Downloading ZIP package instead.`);
      await handleZipExport(folderName, items);
    }
  };

  // ZIP export
  const handleZipExport = async (folderName: string, items: DCIMImage[]) => {
    setIsExporting(true);
    setExportProgress({ percent: 20, text: 'Packaging download archive into dated folder...' });

    try {
      await downloadHousekeepZip(folderName, items, (percent, text) => {
        setExportProgress({ percent, text });
      });
      const freedBytes = items.reduce((sum, img) => sum + img.sizeBytes, 0);
      onConfirmHardDiskBackup(folderName, 'External Hard Disk (ZIP)', freedBytes);
      showToast(`Downloaded ${folderName}.zip for your hard drive!`);
    } catch {
      showToast('Error creating ZIP archive.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Free phone space
  const handleFreeSpace = (folderName: string, items: DCIMImage[]) => {
    const ids = items.map((i) => i.id);
    const freedBytes = items.reduce((sum, i) => sum + i.sizeBytes, 0);
    onFreePhoneSpace(ids, folderName);
    showToast(`Freed ${formatBytes(freedBytes)} from phone storage!`);
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'whatsapp':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded">
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp</span>
          </span>
        );
      case 'telegram':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2 py-0.5 rounded">
            <Send className="w-3 h-3" />
            <span>Telegram</span>
          </span>
        );
      case 'downloads':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2 py-0.5 rounded">
            <FileDown className="w-3 h-3" />
            <span>Downloads</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Target Download Archive Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Dated Download Archive
              </span>
              <span aria-hidden="true">·</span>
              <span>WhatsApp, Telegram &amp; Downloaded Movies</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm md:text-base font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg w-fit">
              <FolderArchive className="w-4 h-4 text-purple-500" />
              <span>/{currentArchiveFolder}/</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Groups all downloaded movies, WhatsApp chat media, and Telegram files into a week and month folder for easy backup to your hard disk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAddSampleDownload('whatsapp')}
              className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate WhatsApp Media</span>
            </button>
            <button
              onClick={() => onAddSampleDownload('telegram')}
              className="px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Telegram Clip</span>
            </button>
            <button
              onClick={() => onAddSampleDownload('downloads')}
              className="px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Simulate 1080p Movie</span>
            </button>
          </div>
        </div>

        {/* Source Partition KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-500" />
              <span>WhatsApp Media</span>
            </span>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {formatBytes(waBytes)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Send className="w-3 h-3 text-sky-500" />
              <span>Telegram Media</span>
            </span>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {formatBytes(tgBytes)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Film className="w-3 h-3 text-purple-500" />
              <span>Downloads &amp; Movies</span>
            </span>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {formatBytes(dlBytes)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 space-y-0.5">
            <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
              Total Reclaimable
            </span>
            <div className="text-sm font-bold font-mono text-purple-700 dark:text-purple-300">
              +{formatBytes(totalInPhoneBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Downloads &amp; Chats ({inPhoneMedia.length})
          </button>
          <button
            onClick={() => setSourceFilter('whatsapp')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              sourceFilter === 'whatsapp'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            WhatsApp ({inPhoneMedia.filter((m) => m.source === 'whatsapp').length})
          </button>
          <button
            onClick={() => setSourceFilter('telegram')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              sourceFilter === 'telegram'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Telegram ({inPhoneMedia.filter((m) => m.source === 'telegram').length})
          </button>
          <button
            onClick={() => setSourceFilter('downloads')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              sourceFilter === 'downloads'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Downloads &amp; Movies ({inPhoneMedia.filter((m) => m.source === 'downloads').length})
          </button>
          <button
            onClick={() => setSourceFilter('staged')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              sourceFilter === 'staged'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Staged Archive ({stagedMedia.length})
          </button>
        </div>

        {sourceFilter !== 'staged' && sourceFilter !== 'archived' && inPhoneMedia.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              {selectedIds.length === filteredMedia.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleArchiveSelected}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>
                Archive to {currentArchiveFolder.split('/')[1] || currentArchiveFolder} (
                {selectedIds.length > 0 ? selectedIds.length : filteredMedia.length})
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {sourceFilter === 'staged' ? (
        /* Staged Download Archive Folders */
        stagedMedia.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <FolderArchive className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Items Currently Staged in Download Archive
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Select WhatsApp videos, Telegram files, or downloaded movies to stage them into your weekly download archive folder.
            </p>
            <button
              onClick={() => setSourceFilter('all')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer"
            >
              View Download &amp; Chat Media
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-purple-500" />
                  <h3 className="text-base font-semibold font-mono text-slate-900 dark:text-white">
                    /{currentArchiveFolder}/
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>{stagedMedia.length} files</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">
                    {formatBytes(stagedMedia.reduce((s, m) => s + m.sizeBytes, 0))}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Ready for Hard Disk Transfer</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={isExporting}
                  onClick={() => handleDirectExport(currentArchiveFolder, stagedMedia)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 text-purple-500" />
                  <span>Direct to Hard Disk</span>
                </button>

                <button
                  disabled={isExporting}
                  onClick={() => handleZipExport(currentArchiveFolder, stagedMedia)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ZIP</span>
                </button>

                <button
                  onClick={() => handleFreeSpace(currentArchiveFolder, stagedMedia)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Free Phone Storage ({formatBytes(stagedMedia.reduce((s, m) => s + m.sizeBytes, 0))})
                  </span>
                </button>
              </div>
            </div>

            {/* Export progress */}
            {isExporting && exportProgress && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-mono">
                  <span>{exportProgress.text}</span>
                  <span>{exportProgress.percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${exportProgress.percent}%` }}
                    className="h-full bg-purple-600 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Staged items grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {stagedMedia.map((img) => (
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
                  <div className="p-1.5 space-y-0.5">
                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                      {img.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{formatBytes(img.sizeBytes)}</span>
                      <span className="capitalize">{img.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* In Phone Media Grid */
        <div className="space-y-4">
          {filteredMedia.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No unarchived media in this category!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                All downloaded movies and chat media have been organized into your dated download archive.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredMedia.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isVideoOrMovie =
                  item.category === 'downloaded_movie' ||
                  item.category === 'chat_video' ||
                  item.category === 'large_video';

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-600/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    } bg-white dark:bg-slate-900`}
                  >
                    <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {/* Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-black/40 text-transparent hover:bg-black/60'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>

                      {/* Video/Movie Icon Indicator */}
                      {isVideoOrMovie && (
                        <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white backdrop-blur-xs">
                          {item.category === 'downloaded_movie' ? (
                            <Film className="w-3.5 h-3.5" />
                          ) : (
                            <Video className="w-3.5 h-3.5" />
                          )}
                        </div>
                      )}

                      {/* Size tag */}
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs font-semibold">
                        {formatBytes(item.sizeBytes)}
                      </span>
                    </div>

                    <div className="p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between">
                        {getSourceBadge(item.source)}
                        <span className="text-[11px] text-slate-400">
                          {formatDateReadable(item.dateTaken)}
                        </span>
                      </div>
                      {item.originalPath && (
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {item.originalPath}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
