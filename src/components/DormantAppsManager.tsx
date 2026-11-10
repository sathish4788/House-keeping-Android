import React, { useState } from 'react';
import {
  Layers,
  Trash2,
  Clock,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react';
import { InstalledApp } from '../types';
import { formatBytes, getDaysAgo, formatDateReadable } from '../utils/dateUtils';

interface DormantAppsManagerProps {
  apps: InstalledApp[];
  onUninstallApp: (appId: string) => void;
  onBatchUninstall: (appIds: string[]) => void;
  onRestoreApp: (appId: string) => void;
}

export const DormantAppsManager: React.FC<DormantAppsManagerProps> = ({
  apps,
  onUninstallApp,
  onBatchUninstall,
  onRestoreApp
}) => {
  const [filterMode, setFilterMode] = useState<'dormant_30' | 'dormant_60' | 'all' | 'uninstalled'>('dormant_30');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [appToUninstall, setAppToUninstall] = useState<InstalledApp | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter apps
  const activeApps = apps.filter((a) => !a.uninstalled);
  const uninstalledApps = apps.filter((a) => a.uninstalled);

  const filteredApps = activeApps.filter((app) => {
    const daysAgo = getDaysAgo(app.lastUsedDate);
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'dormant_30') return daysAgo >= 30;
    if (filterMode === 'dormant_60') return daysAgo >= 60;
    return true; // all
  });

  const dormant30Count = activeApps.filter((a) => getDaysAgo(a.lastUsedDate) >= 30).length;
  const dormant30Bytes = activeApps
    .filter((a) => getDaysAgo(a.lastUsedDate) >= 30)
    .reduce((sum, a) => sum + (a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes), 0);

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedAppIds.length === filteredApps.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(filteredApps.filter((a) => !a.isSystemApp).map((a) => a.id));
    }
  };

  const handleConfirmUninstallSingle = () => {
    if (!appToUninstall) return;
    const totalFreed = appToUninstall.sizeBytes + appToUninstall.dataSizeBytes + appToUninstall.cacheSizeBytes;
    onUninstallApp(appToUninstall.id);
    showToast(`Uninstalled ${appToUninstall.name} · Freed ${formatBytes(totalFreed)}`);
    setAppToUninstall(null);
  };

  const handleBatchUninstall = () => {
    if (selectedAppIds.length === 0) return;
    const targetApps = activeApps.filter((a) => selectedAppIds.includes(a.id));
    const totalFreed = targetApps.reduce(
      (sum, a) => sum + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes,
      0
    );
    onBatchUninstall(selectedAppIds);
    showToast(`Uninstalled ${selectedAppIds.length} apps · Freed ${formatBytes(totalFreed)} from phone storage`);
    setSelectedAppIds([]);
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

      {/* Confirmation Modal */}
      {appToUninstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center text-2xl shrink-0">
                {appToUninstall.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Uninstall {appToUninstall.name}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {appToUninstall.packageName}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>App APK Binary</span>
                <span className="font-mono">{formatBytes(appToUninstall.sizeBytes)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>User Saved Data</span>
                <span className="font-mono">{formatBytes(appToUninstall.dataSizeBytes)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Cache & Temp Files</span>
                <span className="font-mono">{formatBytes(appToUninstall.cacheSizeBytes)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-semibold text-slate-900 dark:text-white">
                <span>Total Space to Reclaim</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatBytes(appToUninstall.sizeBytes + appToUninstall.dataSizeBytes + appToUninstall.cacheSizeBytes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Not used in {getDaysAgo(appToUninstall.lastUsedDate)} days (since {formatDateReadable(appToUninstall.lastUsedDate)}).
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAppToUninstall(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUninstallSingle}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Uninstall & Free Storage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dormant Apps Summary Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Inactive Apps Audit
              </span>
              <span aria-hidden="true">·</span>
              <span>30+ Days Inactivity Policy</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {dormant30Count} Apps Unused for &gt;30 Days
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reclaim up to <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatBytes(dormant30Bytes)}</strong> by uninstalling dormant apps you haven&apos;t opened in over a month.
            </p>
          </div>

          {selectedAppIds.length > 0 && (
            <button
              onClick={handleBatchUninstall}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Uninstall Selected ({selectedAppIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
          <button
            onClick={() => setFilterMode('dormant_30')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'dormant_30'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Unused &gt; 30 Days ({dormant30Count})
          </button>
          <button
            onClick={() => setFilterMode('dormant_60')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'dormant_60'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Unused &gt; 60 Days ({activeApps.filter((a) => getDaysAgo(a.lastUsedDate) >= 60).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Installed ({activeApps.length})
          </button>
          <button
            onClick={() => setFilterMode('uninstalled')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'uninstalled'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Uninstalled History ({uninstalledApps.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, package..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Apps List */}
      {filterMode === 'uninstalled' ? (
        /* Uninstalled Archive */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Previously Uninstalled Apps
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apps removed via HousekeepOS. You can simulate reinstalling them anytime.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
              {formatBytes(
                uninstalledApps.reduce((s, a) => s + a.sizeBytes + a.dataSizeBytes + a.cacheSizeBytes, 0)
              )}{' '}
              Freed
            </span>
          </div>

          {uninstalledApps.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No apps uninstalled yet. Use the &quot;Unused &gt; 30 Days&quot; tab to free up app space.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {uninstalledApps.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 opacity-70">
                      {app.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {app.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{app.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          {formatBytes(app.sizeBytes + app.dataSizeBytes + app.cacheSizeBytes)} reclaimed
                        </span>
                        {app.uninstalledAt && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Uninstalled {formatDateReadable(app.uninstalledAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreApp(app.id);
                      showToast(`Reinstalled ${app.name}`);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reinstall</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active Apps List */
        <div className="space-y-3">
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No apps match this criteria!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your phone is free of dormant apps in this view.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
              {/* Table header bar */}
              <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs font-medium text-slate-500">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    aria-label="Select all apps"
                    checked={
                      selectedAppIds.length > 0 &&
                      selectedAppIds.length === filteredApps.filter((a) => !a.isSystemApp).length
                    }
                    onChange={selectAllFiltered}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Application Details</span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="hidden sm:inline">Last Used</span>
                  <span>Total Storage</span>
                  <span className="w-20 text-right">Action</span>
                </div>
              </div>

              {filteredApps.map((app) => {
                const daysAgo = getDaysAgo(app.lastUsedDate);
                const totalBytes = app.sizeBytes + app.dataSizeBytes + app.cacheSizeBytes;
                const isDormant = daysAgo >= 30;
                const isSelected = selectedAppIds.includes(app.id);

                return (
                  <div
                    key={app.id}
                    className={`px-5 py-4 flex items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {!app.isSystemApp ? (
                        <input
                          type="checkbox"
                          aria-label={`Select ${app.name}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(app.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                        />
                      ) : (
                        <div className="w-4 h-4 shrink-0" />
                      )}

                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 shadow-xs">
                        {app.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {app.name}
                          </p>
                          {app.isSystemApp && (
                            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              System
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{app.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono truncate">{app.packageName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                      {/* Inactivity Status */}
                      <div className="text-right">
                        {isDormant ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{daysAgo}d unused</span>
                            </span>
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              {formatDateReadable(app.lastUsedDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                          </span>
                        )}
                      </div>

                      {/* Storage Size */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {formatBytes(totalBytes)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono hidden md:block">
                          APK: {formatBytes(app.sizeBytes, 0)}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="w-20 text-right">
                        {app.isSystemApp ? (
                          <span className="text-[11px] text-slate-400 italic">Protected</span>
                        ) : (
                          <button
                            onClick={() => setAppToUninstall(app)}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Uninstall</span>
                          </button>
                        )}
                      </div>
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
