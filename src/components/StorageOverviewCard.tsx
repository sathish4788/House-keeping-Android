import React from 'react';
import { HardDrive, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { StorageDeviceStatus } from '../types';
import { formatBytes } from '../utils/dateUtils';

interface StorageOverviewCardProps {
  storage: StorageDeviceStatus;
  reclaimableBytes: number;
  unarchivedImagesBytes: number;
  dormantAppsBytes: number;
  onRunScan: () => void;
  onOpenHardDiskModal: () => void;
  onViewDormantApps: () => void;
}

export const StorageOverviewCard: React.FC<StorageOverviewCardProps> = ({
  storage,
  reclaimableBytes,
  unarchivedImagesBytes,
  dormantAppsBytes,
  onRunScan,
  onOpenHardDiskModal,
  onViewDormantApps
}) => {
  const usedPercent = Math.min(100, Math.round((storage.usedBytes / storage.totalCapacityBytes) * 100));
  const freePercent = 100 - usedPercent;

  const dcimPercent = (storage.dcimBytes / storage.totalCapacityBytes) * 100;
  const appsPercent = (storage.appsBytes / storage.totalCapacityBytes) * 100;
  const sysPercent = (storage.systemBytes / storage.totalCapacityBytes) * 100;
  const otherPercent = (storage.otherBytes / storage.totalCapacityBytes) * 100;

  const isLowStorage = usedPercent >= 80;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Phone Internal Storage</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">128 GB UFS 3.1</span>
            <span aria-hidden="true">·</span>
            <span>Android / DCIM</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatBytes(storage.usedBytes, 1)}
            </h2>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 font-mono">
              used of {formatBytes(storage.totalCapacityBytes, 0)} ({usedPercent}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLowStorage ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Storage 80%+ full — Housekeeping recommended</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Storage healthy</span>
            </div>
          )}
        </div>
      </div>

      {/* Segmented Multi-Bar Visualizer */}
      <div className="mt-5 space-y-2">
        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5">
          <div
            style={{ width: `${dcimPercent}%` }}
            className="h-full bg-indigo-500 rounded-l-full transition-all duration-500"
            title={`DCIM Photos & Videos: ${formatBytes(storage.dcimBytes)}`}
          />
          <div
            style={{ width: `${appsPercent}%` }}
            className="h-full bg-sky-500 transition-all duration-500"
            title={`Installed Apps & Data: ${formatBytes(storage.appsBytes)}`}
          />
          <div
            style={{ width: `${sysPercent}%` }}
            className="h-full bg-slate-400 dark:bg-slate-500 transition-all duration-500"
            title={`System & OS: ${formatBytes(storage.systemBytes)}`}
          />
          <div
            style={{ width: `${otherPercent}%` }}
            className="h-full bg-amber-500 transition-all duration-500"
            title={`Other & Cache: ${formatBytes(storage.otherBytes)}`}
          />
          <div
            style={{ width: `${freePercent}%` }}
            className="h-full bg-transparent rounded-r-full"
            title={`Free Space: ${formatBytes(storage.freeBytes)}`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">DCIM Media:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">
              {formatBytes(storage.dcimBytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Apps & Data:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">
              {formatBytes(storage.appsBytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">System OS:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">
              {formatBytes(storage.systemBytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Free Space:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">
              {formatBytes(storage.freeBytes)}
            </span>
          </div>
        </div>
      </div>

      {/* Housekeeping Gain Potential Banner */}
      <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Weekly Run Potential
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">· Detected this week</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              {formatBytes(reclaimableBytes)}
            </strong>{' '}
            can be freed by staging <strong className="font-mono">{formatBytes(unarchivedImagesBytes)}</strong> of DCIM photos to hard disk & uninstalling <strong className="font-mono">{formatBytes(dormantAppsBytes)}</strong> of dormant apps.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={onViewDormantApps}
            className="flex-1 md:flex-initial px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Apps ({formatBytes(dormantAppsBytes)})
          </button>
          <button
            onClick={onOpenHardDiskModal}
            className="flex-1 md:flex-initial px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Hard Disk</span>
          </button>
          <button
            onClick={onRunScan}
            className="flex-1 md:flex-initial px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <span>Scan & Housekeep</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
