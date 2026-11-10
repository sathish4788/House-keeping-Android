import React, { useState } from 'react';
import {
  HardDrive,
  Usb,
  FolderArchive,
  Download,
  CheckCircle2,
  X,
  ArrowRight,
  Info
} from 'lucide-react';
import { DCIMImage, HousekeepFolderSettings } from '../types';
import { formatBytes, generateHousekeepFolderName } from '../utils/dateUtils';
import { downloadHousekeepZip, writeDirectToDirectoryPicker } from '../utils/zipExporter';

interface HardDiskConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  stagedImages: DCIMImage[];
  folderSettings: HousekeepFolderSettings;
  onBackupSuccess: (folderName: string, driveName: string, freedBytes: number) => void;
}

export const HardDiskConnectModal: React.FC<HardDiskConnectModalProps> = ({
  isOpen,
  onClose,
  stagedImages,
  folderSettings,
  onBackupSuccess
}) => {
  const [selectedDrive, setSelectedDrive] = useState<string>('SanDisk Extreme 1TB');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState<{ percent: number; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentWeekFolderName = generateHousekeepFolderName(
    new Date(),
    folderSettings.namingTemplate,
    folderSettings.prefixFolder
  );

  const totalBytes = stagedImages.reduce((sum, img) => sum + img.sizeBytes, 0);

  const handleDirectPicker = async () => {
    setIsTransferring(true);
    setTransferProgress({ percent: 15, text: 'Opening file system directory picker...' });

    const res = await writeDirectToDirectoryPicker(currentWeekFolderName, stagedImages, (percent, text) => {
      setTransferProgress({ percent, text });
    });

    setIsTransferring(false);
    setTransferProgress(null);

    if (res.success) {
      onBackupSuccess(currentWeekFolderName, res.driveName || 'External Hard Disk', totalBytes);
      setStatusMessage(`Backup verified to ${res.driveName}! You can now safely free phone storage.`);
    } else {
      setStatusMessage(`Directory access: ${res.error || 'Cancelled'}`);
    }
  };

  const handleDownloadZip = async () => {
    setIsTransferring(true);
    setTransferProgress({ percent: 20, text: 'Building housekeep folder archive...' });

    try {
      await downloadHousekeepZip(currentWeekFolderName, stagedImages, (percent, text) => {
        setTransferProgress({ percent, text });
      });
      onBackupSuccess(currentWeekFolderName, `${selectedDrive} (ZIP)`, totalBytes);
      setStatusMessage(`Downloaded ${currentWeekFolderName}.zip! Copy this to your hard drive.`);
    } catch {
      setStatusMessage('Error exporting ZIP archive.');
    } finally {
      setIsTransferring(false);
      setTransferProgress(null);
    }
  };

  const handleSimulateBackup = () => {
    onBackupSuccess(currentWeekFolderName, selectedDrive, totalBytes);
    setStatusMessage(`Simulated transfer to ${selectedDrive}! Phone space is now ready to be cleared.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Housekeep from Phone to Hard Disk
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transfer weekly photo folders to external storage &amp; free phone memory
            </p>
          </div>
        </div>

        {/* Workflow Steps Guide */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>How Weekly Hard Disk Offloading Works:</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">STEP 1</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Housekeep</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Move to week/month folder</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">STEP 2</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Transfer</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Direct write or ZIP to HDD</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">STEP 3</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Free Space</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Reclaim phone GBs</p>
            </div>
          </div>
        </div>

        {/* Current Folder Info */}
        <div className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-500">Folder to Offload:</span>
            <div className="font-mono font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FolderArchive className="w-3.5 h-3.5 text-indigo-500" />
              <span>/DCIM/{currentWeekFolderName}/</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Total Size:</span>
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {formatBytes(totalBytes)} ({stagedImages.length} items)
            </div>
          </div>
        </div>

        {/* Drive Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Detected / Target External Drive:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['SanDisk Extreme 1TB', 'WD My Passport 2TB', 'Samsung T7 Shield', 'USB-OTG Thumb Drive'].map(
              (drive) => (
                <button
                  key={drive}
                  onClick={() => setSelectedDrive(drive)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                    selectedDrive === drive
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-medium'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Usb className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{drive}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Progress or status */}
        {isTransferring && transferProgress && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
              <span>{transferProgress.text}</span>
              <span>{transferProgress.percent}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${transferProgress.percent}%` }}
                className="h-full bg-indigo-600 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            disabled={isTransferring}
            onClick={handleDirectPicker}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <HardDrive className="w-4 h-4" />
            <span>Pick Folder &amp; Write to Drive</span>
          </button>

          <button
            disabled={isTransferring}
            onClick={handleDownloadZip}
            className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Structured ZIP</span>
          </button>
        </div>

        <button
          onClick={handleSimulateBackup}
          className="w-full text-center text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
        >
          Or click here to mark {selectedDrive} backup as verified
        </button>
      </div>
    </div>
  );
};
