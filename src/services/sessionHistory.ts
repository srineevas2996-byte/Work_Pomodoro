import { reactive, watch } from 'vue';
import { logSessionToFile, openLogFile, getLogFileContent } from './tauriBridge';

export type SessionSatisfaction = 'Bad' | 'OK' | 'Good';

export interface SessionRecord {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM:SS
  category: string;
  durationMinutes: number;
  satisfaction: SessionSatisfaction;
}

export const PREDEFINED_CATEGORIES = [
  'Coding',
  'Studying',
  'Reading',
  'Research',
] as const;

const SESSIONS_STORAGE_KEY = 'work_pomodoro_sessions_v1';
const CUSTOM_CATEGORIES_STORAGE_KEY = 'work_pomodoro_custom_categories_v1';
const ACTIVE_CATEGORY_STORAGE_KEY = 'work_pomodoro_active_category_v1';

function loadCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom categories:', e);
  }
  return [];
}

function loadActiveCategory(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_CATEGORY_STORAGE_KEY);
    if (saved && saved.trim()) return saved;
  } catch (e) {
    console.error('Failed to load active category:', e);
  }
  return 'Coding';
}

function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions:', e);
  }
  return [];
}

export const historyStore = reactive({
  activeCategory: loadActiveCategory(),
  customCategories: loadCustomCategories(),
  sessions: loadSessions(),
});

// Watch and persist
watch(
  () => historyStore.customCategories,
  (newVal) => {
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(newVal));
    } catch (e) {
      console.error('Failed to save custom categories:', e);
    }
  },
  { deep: true }
);

watch(
  () => historyStore.activeCategory,
  (newVal) => {
    try {
      localStorage.setItem(ACTIVE_CATEGORY_STORAGE_KEY, newVal);
    } catch (e) {
      console.error('Failed to save active category:', e);
    }
  }
);

watch(
  () => historyStore.sessions,
  (newVal) => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newVal));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  },
  { deep: true }
);

export function getAllCategories(): string[] {
  const list: string[] = [...PREDEFINED_CATEGORIES];
  for (const c of historyStore.customCategories) {
    if (!list.includes(c)) {
      list.push(c);
    }
  }
  return list;
}

export function setActiveCategory(category: string) {
  if (category && category.trim()) {
    historyStore.activeCategory = category.trim();
  }
}

export function addCustomCategory(category: string): boolean {
  const trimmed = category.trim();
  if (!trimmed) return false;
  const exists = getAllCategories().some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (!exists) {
    historyStore.customCategories.push(trimmed);
  }
  historyStore.activeCategory = trimmed;
  return true;
}

export function removeCustomCategory(category: string) {
  historyStore.customCategories = historyStore.customCategories.filter(
    (c) => c !== category
  );
  if (historyStore.activeCategory === category) {
    historyStore.activeCategory = 'Coding';
  }
}

function formatDate(date: Date): { dateStr: string; timeStr: string } {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr: `${hh}:${min}:${ss}`,
  };
}

/**
 * Record a completed focus session, store it in state/localStorage,
 * and append a formatted line to work_pomodoro_sessions.txt.
 */
export async function logCompletedSession(
  category: string,
  durationMinutes: number,
  satisfaction: SessionSatisfaction = 'Good'
): Promise<SessionRecord> {
  const now = new Date();
  const { dateStr, timeStr } = formatDate(now);
  const cat = category.trim() || historyStore.activeCategory || 'Coding';

  const record: SessionRecord = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.getTime(),
    dateStr,
    timeStr,
    category: cat,
    durationMinutes: Math.max(1, Math.round(durationMinutes)),
    satisfaction,
  };

  historyStore.sessions.unshift(record);

  // Format single line for the plain text log file
  // [YYYY-MM-DD HH:MM:SS] Category: Coding | Duration: 25 min | Satisfaction: Good
  const textLine = `[${dateStr} ${timeStr}] Category: ${record.category} | Duration: ${record.durationMinutes} min | Satisfaction: ${record.satisfaction}`;
  try {
    await logSessionToFile(textLine);
  } catch (err) {
    console.warn('Failed to append session to text log file:', err);
  }

  return record;
}

export function deleteSession(id: string) {
  historyStore.sessions = historyStore.sessions.filter((s) => s.id !== id);
}

export function clearAllSessions() {
  historyStore.sessions = [];
}

export async function openSessionTextLog(): Promise<void> {
  await openLogFile();
}

export async function fetchRawTextLog(): Promise<string> {
  return await getLogFileContent();
}

/* -------------------------------------------------------------------------- */
/* Curated Analytics Aggregation Functions                                    */
/* -------------------------------------------------------------------------- */

export interface CategoryStat {
  category: string;
  totalMinutes: number;
  sessionCount: number;
  percentage: number;
}

export interface SatisfactionStat {
  good: number;
  ok: number;
  bad: number;
}

export interface PeriodStats {
  periodLabel: string;
  totalMinutes: number;
  totalSessions: number;
  satisfaction: SatisfactionStat;
  categoryStats: CategoryStat[];
  chartData: { label: string; value: number; secondaryLabel?: string }[];
  sessions: SessionRecord[];
}

function calculateCategoryBreakdown(sessions: SessionRecord[]): CategoryStat[] {
  const map: Record<string, { minutes: number; count: number }> = {};
  let overallMinutes = 0;

  for (const s of sessions) {
    if (!map[s.category]) {
      map[s.category] = { minutes: 0, count: 0 };
    }
    map[s.category].minutes += s.durationMinutes;
    map[s.category].count += 1;
    overallMinutes += s.durationMinutes;
  }

  return Object.entries(map)
    .map(([cat, val]) => ({
      category: cat,
      totalMinutes: val.minutes,
      sessionCount: val.count,
      percentage: overallMinutes > 0 ? Math.round((val.minutes / overallMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

function calculateSatisfaction(sessions: SessionRecord[]): SatisfactionStat {
  const sat: SatisfactionStat = { good: 0, ok: 0, bad: 0 };
  for (const s of sessions) {
    if (s.satisfaction === 'Good') sat.good += 1;
    else if (s.satisfaction === 'OK') sat.ok += 1;
    else if (s.satisfaction === 'Bad') sat.bad += 1;
  }
  return sat;
}

// 1. Daily Stats (Per-Day)
export function getDailyStats(targetDate: Date = new Date()): PeriodStats {
  const { dateStr } = formatDate(targetDate);
  const filtered = historyStore.sessions.filter((s) => s.dateStr === dateStr);

  const totalMinutes = filtered.reduce((acc, s) => acc + s.durationMinutes, 0);
  const satisfaction = calculateSatisfaction(filtered);
  const categoryStats = calculateCategoryBreakdown(filtered);

  // Group by 2-hour blocks throughout the day (00:00 - 24:00)
  const blocks = [
    { label: '00-04', min: 0, max: 4, val: 0 },
    { label: '04-08', min: 4, max: 8, val: 0 },
    { label: '08-12', min: 8, max: 12, val: 0 },
    { label: '12-16', min: 12, max: 16, val: 0 },
    { label: '16-20', min: 16, max: 20, val: 0 },
    { label: '20-24', min: 20, max: 24, val: 0 },
  ];

  for (const s of filtered) {
    const hour = parseInt(s.timeStr.split(':')[0], 10) || 0;
    const block = blocks.find((b) => hour >= b.min && hour < b.max);
    if (block) {
      block.val += s.durationMinutes;
    }
  }

  const chartData = blocks.map((b) => ({
    label: b.label,
    value: b.val,
    secondaryLabel: `${b.val}m`,
  }));

  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const periodLabel = targetDate.toLocaleDateString(undefined, options);

  return {
    periodLabel,
    totalMinutes,
    totalSessions: filtered.length,
    satisfaction,
    categoryStats,
    chartData,
    sessions: filtered,
  };
}

// 2. Weekly Stats (Per-Week: Monday through Sunday)
export function getWeeklyStats(referenceDate: Date = new Date()): PeriodStats {
  const curr = new Date(referenceDate);
  // Get Monday of current week
  const day = curr.getDay(); // 0 is Sun, 1 is Mon...
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDays: { dateStr: string; label: string }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const { dateStr } = formatDate(d);
    weekDays.push({ dateStr, label: daysOfWeek[i] });
  }

  const dateSet = new Set(weekDays.map((w) => w.dateStr));
  const filtered = historyStore.sessions.filter((s) => dateSet.has(s.dateStr));

  const totalMinutes = filtered.reduce((acc, s) => acc + s.durationMinutes, 0);
  const satisfaction = calculateSatisfaction(filtered);
  const categoryStats = calculateCategoryBreakdown(filtered);

  const chartData = weekDays.map((wd) => {
    const daySessions = filtered.filter((s) => s.dateStr === wd.dateStr);
    const dayMins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    return {
      label: wd.label,
      value: dayMins,
      secondaryLabel: dayMins > 0 ? `${dayMins}m` : '-',
    };
  });

  const periodLabel = `Week of ${weekDays[0].dateStr} - ${weekDays[6].dateStr}`;

  return {
    periodLabel,
    totalMinutes,
    totalSessions: filtered.length,
    satisfaction,
    categoryStats,
    chartData,
    sessions: filtered,
  };
}

// 3. Monthly Stats (Per-Month: 1st to End of Month)
export function getMonthlyStats(year = new Date().getFullYear(), month = new Date().getMonth()): PeriodStats {
  const start = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${yyyy}-${mm}`;

  const filtered = historyStore.sessions.filter((s) => s.dateStr.startsWith(monthPrefix));

  const totalMinutes = filtered.reduce((acc, s) => acc + s.durationMinutes, 0);
  const satisfaction = calculateSatisfaction(filtered);
  const categoryStats = calculateCategoryBreakdown(filtered);

  // Group into 4-5 weeks/buckets or individual days
  const chartData: { label: string; value: number; secondaryLabel?: string }[] = [];
  const bucketSize = Math.ceil(daysInMonth / 6); // 5-6 buckets for sleek rendering

  for (let i = 1; i <= daysInMonth; i += bucketSize) {
    const endDay = Math.min(i + bucketSize - 1, daysInMonth);
    const label = `${i}-${endDay}`;
    let bucketMins = 0;

    for (let d = i; d <= endDay; d++) {
      const dd = String(d).padStart(2, '0');
      const dStr = `${monthPrefix}-${dd}`;
      const dayMins = filtered
        .filter((s) => s.dateStr === dStr)
        .reduce((acc, s) => acc + s.durationMinutes, 0);
      bucketMins += dayMins;
    }

    chartData.push({
      label,
      value: bucketMins,
      secondaryLabel: bucketMins > 0 ? `${bucketMins}m` : '0m',
    });
  }

  const monthName = start.toLocaleString('default', { month: 'long', year: 'numeric' });

  return {
    periodLabel: monthName,
    totalMinutes,
    totalSessions: filtered.length,
    satisfaction,
    categoryStats,
    chartData,
    sessions: filtered,
  };
}

// 4. Yearly Stats (Per-Year: Jan - Dec)
export function getYearlyStats(year = new Date().getFullYear()): PeriodStats {
  const yearPrefix = `${year}-`;
  const filtered = historyStore.sessions.filter((s) => s.dateStr.startsWith(yearPrefix));

  const totalMinutes = filtered.reduce((acc, s) => acc + s.durationMinutes, 0);
  const satisfaction = calculateSatisfaction(filtered);
  const categoryStats = calculateCategoryBreakdown(filtered);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = months.map((m, idx) => {
    const mm = String(idx + 1).padStart(2, '0');
    const targetPrefix = `${year}-${mm}`;
    const monthMins = filtered
      .filter((s) => s.dateStr.startsWith(targetPrefix))
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    const hours = (monthMins / 60).toFixed(1);
    return {
      label: m,
      value: monthMins,
      secondaryLabel: monthMins > 0 ? `${hours}h` : '-',
    };
  });

  return {
    periodLabel: `Year ${year}`,
    totalMinutes,
    totalSessions: filtered.length,
    satisfaction,
    categoryStats,
    chartData,
    sessions: filtered,
  };
}

// 5. All-Time Stats
export function getAllTimeStats(): PeriodStats {
  const filtered = [...historyStore.sessions];
  const totalMinutes = filtered.reduce((acc, s) => acc + s.durationMinutes, 0);
  const satisfaction = calculateSatisfaction(filtered);
  const categoryStats = calculateCategoryBreakdown(filtered);

  // Group by last 6 active months or years
  const chartData: { label: string; value: number; secondaryLabel?: string }[] = [];
  const monthMap: Record<string, number> = {};

  for (const s of filtered) {
    const ym = s.dateStr.substring(0, 7); // YYYY-MM
    monthMap[ym] = (monthMap[ym] || 0) + s.durationMinutes;
  }

  const sortedMonths = Object.keys(monthMap).sort().slice(-6);
  for (const ym of sortedMonths) {
    const mins = monthMap[ym];
    chartData.push({
      label: ym.substring(5), // MM
      value: mins,
      secondaryLabel: `${Math.round(mins / 60)}h`,
    });
  }

  return {
    periodLabel: 'All-Time Lifetime Stats',
    totalMinutes,
    totalSessions: filtered.length,
    satisfaction,
    categoryStats,
    chartData,
    sessions: filtered,
  };
}
