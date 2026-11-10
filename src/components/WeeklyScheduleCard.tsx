import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  HardDrive,
  FolderArchive,
  Save,
  CheckCircle2,
  Play,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { HousekeepFolderSettings } from '../types';
import { generateHousekeepFolderName } from '../utils/dateUtils';

interface WeeklyScheduleCardProps {
  settings: HousekeepFolderSettings;
  onSaveSettings: (settings: HousekeepFolderSettings) => void;
  onTriggerManualRun: () => void;
}

export const WeeklyScheduleCard: React.FC<WeeklyScheduleCardProps> = ({
  settings,
  onSaveSettings,
  onTriggerManualRun
}) => {
  const [localSettings, setLocalSettings] = useState<HousekeepFolderSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const previewFolderName = generateHousekeepFolderName(
    new Date(),
    localSettings.namingTemplate,
    localSettings.prefixFolder
  );

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Schedule Configuration Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Automation Schedule
              </span>
              <span aria-hidden="true">·</span>
              <span>Background Phone Run</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Weekly Housekeeping Engine
            </h2>
          </div>

          <button
            onClick={onTriggerManualRun}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Housekeeping Now</span>
          </button>
        </div>

        {/* Schedule Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Weekly Run Day:</span>
            </label>
            <select
              aria-label="Weekly run day"
              value={localSettings.scheduleDayOfWeek}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, scheduleDayOfWeek: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {daysOfWeek.map((day, idx) => (
                <option key={day} value={idx}>
                  Every {day}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              The phone scans DCIM photos and audits apps once per week on this day.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Execution Time:</span>
            </label>
            <select
              aria-label="Execution time"
              value={localSettings.scheduleHour}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, scheduleHour: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono"
            >
              <option value={1}>01:00 AM (Recommended - Overnight Charging)</option>
              <option value={2}>02:00 AM (Overnight)</option>
              <option value={3}>03:00 AM (Overnight)</option>
              <option value={9}>09:00 AM (Morning)</option>
              <option value={20}>08:00 PM (Evening)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Runs quietly when phone is idle and connected to Wi-Fi/charger.
            </p>
          </div>
        </div>

        {/* Notification toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <input
              type="checkbox"
              checked={localSettings.autoNotify}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoNotify: e.target.checked })
              }
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Weekly Housekeeping Notification</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Alerts you with the weekly storage report and prompts you to connect your hard disk to free phone storage.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Housekeep Folder Naming & Rules */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-indigo-500" />
            <span>Folder Naming &amp; Sorting Rules</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define how DCIM images are organized into week and month folders for hard disk housekeeping.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Folder Naming Format Template:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'YYYY_Mon_Week_N' as const,
                  name: 'YYYY_Mon_Week_N',
                  example: 'housekeep/2026_Nov_Week_2'
                },
                {
                  id: 'Mon_Week_N' as const,
                  name: 'Mon_Week_N',
                  example: 'housekeep/Nov_Week_2'
                },
                {
                  id: 'Week_N_Mon_YYYY' as const,
                  name: 'Week_N_Mon_YYYY',
                  example: 'housekeep/Week_2_November_2026'
                },
                {
                  id: 'YYYY-Www' as const,
                  name: 'YYYY-Www-Month',
                  example: 'housekeep/2026-W45-Nov'
                }
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, namingTemplate: tmpl.id })
                  }
                  className={`p-3 rounded-xl border text-left transition-all ${
                    localSettings.namingTemplate === tmpl.id
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 font-medium'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {tmpl.name}
                  </p>
                  <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                    {tmpl.example}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-500">Live Target Folder Path on Phone:</span>
            <div className="font-mono text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-indigo-500" />
              <span>/storage/emulated/0/DCIM/{previewFolderName}/</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              When transferring this folder from DCIM to your hard drive, it will preserve this exact structure.
            </p>
          </div>

          {/* Inactivity Threshold */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Dormant Apps Threshold
              </span>
              <p className="text-[11px] text-slate-500">
                Flags apps as inactive and candidates for uninstallation.
              </p>
            </div>
            <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-lg">
              &gt; 30 Days Inactive
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings saved successfully!</span>
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
