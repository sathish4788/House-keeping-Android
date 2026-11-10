import React from 'react';
import { Sparkles, Layers, FolderArchive, BarChart3, Settings, Film } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: 'housekeep' | 'download_archive' | 'dormant_apps' | 'dcim' | 'report' | 'settings';
  setActiveTab: (tab: 'housekeep' | 'download_archive' | 'dormant_apps' | 'dcim' | 'report' | 'settings') => void;
  dormantAppsCount: number;
  unarchivedImagesCount: number;
  pendingDownloadsCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  setActiveTab,
  dormantAppsCount,
  unarchivedImagesCount,
  pendingDownloadsCount = 0
}) => {
  const tabs = [
    {
      id: 'housekeep' as const,
      label: 'Housekeep',
      icon: Sparkles,
      badge: 0
    },
    {
      id: 'download_archive' as const,
      label: 'Downloads',
      icon: Film,
      badge: pendingDownloadsCount
    },
    {
      id: 'dormant_apps' as const,
      label: 'Apps >30d',
      icon: Layers,
      badge: dormantAppsCount
    },
    {
      id: 'dcim' as const,
      label: 'DCIM',
      icon: FolderArchive,
      badge: unarchivedImagesCount
    },
    {
      id: 'report' as const,
      label: 'Report',
      icon: BarChart3,
      badge: 0
    },
    {
      id: 'settings' as const,
      label: 'Schedule',
      icon: Settings,
      badge: 0
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-6 items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[36px] px-0.5 transition-colors group cursor-pointer"
            >
              <div className="relative">
                <Icon
                  className={`w-4.5 h-4.5 transition-transform group-active:scale-95 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-3.5 px-0.5 text-[9px] font-mono font-bold bg-amber-500 text-white rounded-full flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-medium tracking-tight mt-1 truncate max-w-full ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
