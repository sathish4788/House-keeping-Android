// Date and formatting utilities for HousekeepOS

export function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const dayOfMonth = date.getDate();
  // Standard calendar week of the month
  return Math.ceil((dayOfMonth + dayOfWeek) / 7);
}

export function getMonthShort(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
}

export function getMonthFull(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
}

export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function generateHousekeepFolderName(
  date: Date,
  template: 'YYYY_Mon_Week_N' | 'Mon_Week_N' | 'Week_N_Mon_YYYY' | 'YYYY-Www' = 'YYYY_Mon_Week_N',
  prefix = 'housekeep'
): string {
  const year = date.getFullYear();
  const monthShort = getMonthShort(date);
  const monthFull = getMonthFull(date);
  const weekInMonth = getWeekOfMonth(date);
  const isoWeek = String(getISOWeekNumber(date)).padStart(2, '0');

  let subfolder = '';
  switch (template) {
    case 'YYYY_Mon_Week_N':
      subfolder = `${year}_${monthShort}_Week_${weekInMonth}`;
      break;
    case 'Mon_Week_N':
      subfolder = `${monthShort}_Week_${weekInMonth}`;
      break;
    case 'Week_N_Mon_YYYY':
      subfolder = `Week_${weekInMonth}_${monthFull}_${year}`;
      break;
    case 'YYYY-Www':
      subfolder = `${year}-W${isoWeek}-${monthShort}`;
      break;
    default:
      subfolder = `${year}_${monthShort}_Week_${weekInMonth}`;
  }

  return prefix ? `${prefix}/${subfolder}` : subfolder;
}

export function generateDownloadArchiveFolderName(
  date: Date,
  template: 'YYYY_Mon_Week_N' | 'Mon_Week_N' | 'Week_N_Mon_YYYY' | 'YYYY-Www' = 'YYYY_Mon_Week_N'
): string {
  return generateHousekeepFolderName(date, template, 'download_archive');
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

export function getDaysAgo(dateString: string, referenceDate = new Date()): number {
  const target = new Date(dateString);
  const diffTime = Math.abs(referenceDate.getTime() - target.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDateReadable(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
