import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  HardDrive,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  ArrowUpRight
} from 'lucide-react';
import { MonthlyStorageGain, HousekeepRun } from '../types';
import { formatBytes, formatDateReadable } from '../utils/dateUtils';

interface SixMonthReportChartProps {
  monthlyGains: MonthlyStorageGain[];
  housekeepRuns: HousekeepRun[];
}

export const SixMonthReportChart: React.FC<SixMonthReportChartProps> = ({
  monthlyGains,
  housekeepRuns
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyStorageGain | null>(null);
  const [chartView, setChartView] = useState<'stacked' | 'dcim_only' | 'apps_only'>('stacked');

  // Compute 6-month aggregations
  const totalReclaimedBytes = monthlyGains.reduce((sum, m) => sum + m.totalGainsBytes, 0);
  const totalDcimBytes = monthlyGains.reduce((sum, m) => sum + m.dcimPhotosBytes, 0);
  const totalAppsBytes = monthlyGains.reduce((sum, m) => sum + m.dormantAppsBytes, 0);
  const avgMonthlyBytes = totalReclaimedBytes / (monthlyGains.length || 1);
  const totalRuns = monthlyGains.reduce((sum, m) => sum + m.runsCount, 0);

  // SVG Chart Dimensions
  const chartHeight = 240;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 30;

  // Find max value in GB for chart scale
  const maxMonthlyValGB = Math.max(
    ...monthlyGains.map((m) => {
      if (chartView === 'dcim_only') return m.dcimPhotosBytes / (1024 * 1024 * 1024);
      if (chartView === 'apps_only') return m.dormantAppsBytes / (1024 * 1024 * 1024);
      return m.totalGainsBytes / (1024 * 1024 * 1024);
    }),
    10 // min ceiling 10 GB
  );

  const roundedMaxScale = Math.ceil(maxMonthlyValGB / 2) * 2; // e.g. 10, 12, 14 GB

  // Export report to CSV
  const handleExportCSV = () => {
    const headers = 'Month,Total Storage Freed (GB),DCIM Photos to Harddisk (GB),Dormant Apps Freed (GB),Cache Freed (GB),Runs Count\n';
    const rows = monthlyGains
      .map(
        (m) =>
          `"${m.month}",${(m.totalGainsBytes / 1e9).toFixed(2)},${(m.dcimPhotosBytes / 1e9).toFixed(2)},${(m.dormantAppsBytes / 1e9).toFixed(2)},${(m.cacheTempBytes / 1e9).toFixed(2)},${m.runsCount}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `housekeep_storage_report_6_months_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>6-Month Storage Gains</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-1">
            {formatBytes(totalReclaimedBytes, 1)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <span>Across 6 months of weekly runs</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>DCIM to Hard Disk</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-1">
            {formatBytes(totalDcimBytes, 1)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Safely stored in weekly folders
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Dormant Apps Removed</span>
            <span className="text-xs font-mono font-semibold text-sky-600">30d+</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-1">
            {formatBytes(totalAppsBytes, 1)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Idle app storage freed
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Weekly Housekeeps</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-1">
            {totalRuns} runs
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ~{formatBytes(avgMonthlyBytes, 1)} / month avg gain
          </p>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Storage Reclaimed Report
              </span>
              <span aria-hidden="true">·</span>
              <span>June 2026 – November 2026</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Monthly Storage Gains Breakdown
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setChartView('stacked')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  chartView === 'stacked'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => setChartView('dcim_only')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  chartView === 'dcim_only'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                DCIM Only
              </button>
              <button
                onClick={() => setChartView('apps_only')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  chartView === 'apps_only'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Apps Only
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">DCIM Photos to Hard Disk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Uninstalled Dormant Apps</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Cache & Temp Junk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Duplicate Photos & Videos</span>
          </div>
        </div>

        {/* SVG Interactive Bar Chart */}
        <div className="relative pt-4">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[500px]"
            >
              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + (chartHeight - paddingY * 2) * (1 - ratio);
                const gbLabel = (roundedMaxScale * ratio).toFixed(0);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - 20}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-slate-200 dark:text-slate-800"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400"
                    >
                      {gbLabel}G
                    </text>
                  </g>
                );
              })}

              {/* Monthly Bars */}
              {monthlyGains.map((month, idx) => {
                const usableWidth = chartWidth - paddingX - 20;
                const colWidth = usableWidth / monthlyGains.length;
                const barWidth = 36;
                const x = paddingX + idx * colWidth + (colWidth - barWidth) / 2;
                const bottomY = chartHeight - paddingY;
                const availableHeight = chartHeight - paddingY * 2;

                const maxBytes = roundedMaxScale * 1024 * 1024 * 1024;

                // Segments
                const hDcim = (month.dcimPhotosBytes / maxBytes) * availableHeight;
                const hApps = (month.dormantAppsBytes / maxBytes) * availableHeight;
                const hCache = (month.cacheTempBytes / maxBytes) * availableHeight;
                const hDup = (month.duplicatesBytes / maxBytes) * availableHeight;

                const isHovered = hoveredMonth?.month === month.month;

                return (
                  <g
                    key={month.month}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredMonth(month)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Hover highlight column */}
                    {isHovered && (
                      <rect
                        x={x - 8}
                        y={paddingY}
                        width={barWidth + 16}
                        height={availableHeight}
                        fill="currentColor"
                        className="text-slate-100 dark:text-slate-800/50"
                        rx="8"
                      />
                    )}

                    {chartView === 'stacked' ? (
                      /* Stacked bar */
                      <>
                        {/* 1. DCIM segment (bottom) */}
                        <rect
                          x={x}
                          y={bottomY - hDcim}
                          width={barWidth}
                          height={Math.max(2, hDcim)}
                          className="fill-emerald-500 transition-all hover:brightness-110"
                        />
                        {/* 2. Apps segment */}
                        <rect
                          x={x}
                          y={bottomY - hDcim - hApps}
                          width={barWidth}
                          height={Math.max(2, hApps)}
                          className="fill-indigo-500 transition-all hover:brightness-110"
                        />
                        {/* 3. Cache segment */}
                        <rect
                          x={x}
                          y={bottomY - hDcim - hApps - hCache}
                          width={barWidth}
                          height={Math.max(2, hCache)}
                          className="fill-amber-500 transition-all hover:brightness-110"
                        />
                        {/* 4. Duplicates segment (top) */}
                        <rect
                          x={x}
                          y={bottomY - hDcim - hApps - hCache - hDup}
                          width={barWidth}
                          height={Math.max(2, hDup)}
                          rx="4"
                          className="fill-sky-500 transition-all hover:brightness-110"
                        />
                      </>
                    ) : chartView === 'dcim_only' ? (
                      <rect
                        x={x}
                        y={bottomY - hDcim}
                        width={barWidth}
                        height={Math.max(2, hDcim)}
                        rx="4"
                        className="fill-emerald-500 transition-all"
                      />
                    ) : (
                      <rect
                        x={x}
                        y={bottomY - hApps}
                        width={barWidth}
                        height={Math.max(2, hApps)}
                        rx="4"
                        className="fill-indigo-500 transition-all"
                      />
                    )}

                    {/* Month Label */}
                    <text
                      x={x + barWidth / 2}
                      y={bottomY + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-medium ${
                        isHovered
                          ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                          : 'fill-slate-600 dark:fill-slate-400'
                      }`}
                    >
                      {month.monthShort}
                    </text>

                    {/* Value on top of bar */}
                    <text
                      x={x + barWidth / 2}
                      y={
                        bottomY -
                        (chartView === 'stacked'
                          ? hDcim + hApps + hCache + hDup
                          : chartView === 'dcim_only'
                          ? hDcim
                          : hApps) -
                        6
                      }
                      textAnchor="middle"
                      className="text-[10px] font-mono font-semibold fill-slate-700 dark:fill-slate-300"
                    >
                      {formatBytes(
                        chartView === 'stacked'
                          ? month.totalGainsBytes
                          : chartView === 'dcim_only'
                          ? month.dcimPhotosBytes
                          : month.dormantAppsBytes,
                        1
                      )}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Tooltip Card */}
          {hoveredMonth && (
            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {hoveredMonth.month} Details
                </span>
                <span className="text-slate-500 ml-2">
                  ({hoveredMonth.runsCount} weekly housekeeping runs)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 font-mono">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    DCIM: {formatBytes(hoveredMonth.dcimPhotosBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    Apps: {formatBytes(hoveredMonth.dormantAppsBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Cache: {formatBytes(hoveredMonth.cacheTempBytes)}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white border-l border-slate-300 dark:border-slate-700 pl-3">
                  Total: +{formatBytes(hoveredMonth.totalGainsBytes)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Table of Weekly Housekeeping Runs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Weekly Housekeeping Audit Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete history of weekly folders created, files backed up to external storage, and freed phone capacity.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md">
            {housekeepRuns.length} Runs Logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {housekeepRuns.map((run) => (
            <div
              key={run.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatDateReadable(run.runDate)}
                  </span>
                  <span className="font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                    {run.folderName}
                  </span>
                  {run.hardDiskBackupConfirmed && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{run.targetDriveName || 'Hard Disk Verified'}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>{run.imagesCount} DCIM Photos ({formatBytes(run.imagesSizeBytes)})</span>
                  <span aria-hidden="true">·</span>
                  <span>{run.appsUninstalledCount} Apps Uninstalled</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatBytes(run.cacheFreedBytes)} Cache</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatBytes(run.totalFreedBytes)}
                </span>
                <div className="text-[10px] text-slate-400">Reclaimed to Phone</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
