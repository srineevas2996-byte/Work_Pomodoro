<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  X,
  Calendar,
  Clock,
  Flame,
  Frown,
  Meh,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Tag,
  BarChart2,
  TrendingUp,
  PieChart,
  Copy,
  Check,
} from 'lucide-vue-next';
import {
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  getYearlyStats,
  getAllTimeStats,
  deleteSession,
  openSessionTextLog,
  fetchRawTextLog,
  PeriodStats,
} from '../services/sessionHistory';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

type TimeFrame = 'day' | 'week' | 'month' | 'year' | 'all';
const activeTimeFrame = ref<TimeFrame>('day');

// Date offset navigation for Day / Week / Month / Year
const dayOffset = ref<number>(0);
const weekOffset = ref<number>(0);
const monthOffset = ref<number>(0);
const yearOffset = ref<number>(0);

const isRawLogView = ref(false);
const rawLogContent = ref('');
const copiedLog = ref(false);

async function loadRawLog() {
  rawLogContent.value = await fetchRawTextLog();
}

onMounted(() => {
  loadRawLog();
});

function toggleRawLog() {
  isRawLogView.value = !isRawLogView.value;
  if (isRawLogView.value) {
    loadRawLog();
  }
}

async function copyRawLog() {
  try {
    await navigator.clipboard.writeText(rawLogContent.value);
    copiedLog.value = true;
    setTimeout(() => {
      copiedLog.value = false;
    }, 2000);
  } catch (e) {
    console.error('Failed to copy raw log:', e);
  }
}

const currentStats = computed<PeriodStats>(() => {
  switch (activeTimeFrame.value) {
    case 'day': {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset.value);
      return getDailyStats(d);
    }
    case 'week': {
      const d = new Date();
      d.setDate(d.getDate() + weekOffset.value * 7);
      return getWeeklyStats(d);
    }
    case 'month': {
      const d = new Date();
      d.setMonth(d.getMonth() + monthOffset.value);
      return getMonthlyStats(d.getFullYear(), d.getMonth());
    }
    case 'year': {
      const d = new Date();
      const yr = d.getFullYear() + yearOffset.value;
      return getYearlyStats(yr);
    }
    case 'all':
    default:
      return getAllTimeStats();
  }
});

function navigatePeriod(direction: -1 | 1) {
  if (activeTimeFrame.value === 'day') dayOffset.value += direction;
  else if (activeTimeFrame.value === 'week') weekOffset.value += direction;
  else if (activeTimeFrame.value === 'month') monthOffset.value += direction;
  else if (activeTimeFrame.value === 'year') yearOffset.value += direction;
}

function resetPeriodToCurrent() {
  dayOffset.value = 0;
  weekOffset.value = 0;
  monthOffset.value = 0;
  yearOffset.value = 0;
}

const isCurrentPeriod = computed(() => {
  if (activeTimeFrame.value === 'day') return dayOffset.value === 0;
  if (activeTimeFrame.value === 'week') return weekOffset.value === 0;
  if (activeTimeFrame.value === 'month') return monthOffset.value === 0;
  if (activeTimeFrame.value === 'year') return yearOffset.value === 0;
  return true;
});

function formatMinutes(totalMins: number): string {
  if (totalMins < 60) {
    return `${totalMins}m`;
  }
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// Maximum value in chart for bar height calculation
const maxChartValue = computed(() => {
  const vals = currentStats.value.chartData.map((d) => d.value);
  return Math.max(...vals, 1);
});

const categoryColors = [
  '#f75c54', // Red/Accent
  '#38bdf8', // Blue
  '#a855f7', // Purple
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

function getCategoryColor(index: number): string {
  return categoryColors[index % categoryColors.length];
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="history-card">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon-box">
            <BarChart2 :size="16" />
          </div>
          <div>
            <h2 class="title">Session Analytics</h2>
            <p class="subtitle">Curated Focus History & Text Log</p>
          </div>
        </div>

        <div class="header-actions">
          <!-- Open .txt file in Notepad/OS -->
          <button
            class="header-btn"
            title="Open work_pomodoro_sessions.txt in default text editor"
            @click="openSessionTextLog"
          >
            <FileText :size="13" />
            <span>.txt Log</span>
            <ExternalLink :size="10" />
          </button>

          <!-- Toggle in-app raw text log viewer -->
          <button
            class="header-btn"
            :class="{ active: isRawLogView }"
            :title="isRawLogView ? 'Switch to Visual Dashboard' : 'View Raw Text Log'"
            @click="toggleRawLog"
          >
            <span>{{ isRawLogView ? '📊 Dashboard' : '📄 Raw' }}</span>
          </button>

          <!-- Close Modal -->
          <button class="close-icon-btn" title="Close" @click="emit('close')">
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- Raw Text Log View -->
      <div v-if="isRawLogView" class="raw-log-container">
        <div class="raw-log-header">
          <span class="file-name">work_pomodoro_sessions.txt</span>
          <div class="raw-actions">
            <button class="raw-copy-btn" @click="copyRawLog">
              <Check v-if="copiedLog" :size="12" />
              <Copy v-else :size="12" />
              <span>{{ copiedLog ? 'Copied' : 'Copy All' }}</span>
            </button>
            <button class="raw-open-btn" @click="openSessionTextLog">
              <ExternalLink :size="12" />
              <span>Open in Notepad</span>
            </button>
          </div>
        </div>
        <pre class="raw-log-content">{{ rawLogContent }}</pre>
      </div>

      <!-- Curated Visual Dashboard -->
      <div v-else class="dashboard-container">
        <!-- Time Frame Segmented Control Tabs -->
        <div class="tabs-bar">
          <button
            v-for="tab in (['day', 'week', 'month', 'year', 'all'] as TimeFrame[])"
            :key="tab"
            class="tab-btn"
            :class="{ active: activeTimeFrame === tab }"
            @click="activeTimeFrame = tab"
          >
            {{ tab.toUpperCase() }}
          </button>
        </div>

        <!-- Period Navigator (Prev / Next) -->
        <div v-if="activeTimeFrame !== 'all'" class="navigator-bar">
          <button class="nav-arrow-btn" @click="navigatePeriod(-1)" title="Previous">
            <ChevronLeft :size="15" />
          </button>
          <div class="nav-title-group" @click="resetPeriodToCurrent" title="Click to jump to current">
            <Calendar :size="13" class="nav-calendar-icon" />
            <span class="period-title">{{ currentStats.periodLabel }}</span>
            <span v-if="!isCurrentPeriod" class="current-jump-badge">Today</span>
          </div>
          <button
            class="nav-arrow-btn"
            :disabled="isCurrentPeriod"
            :class="{ disabled: isCurrentPeriod }"
            @click="navigatePeriod(1)"
            title="Next"
          >
            <ChevronRight :size="15" />
          </button>
        </div>

        <div v-else class="navigator-bar all-time-nav">
          <span class="period-title">All-Time Lifetime Summary</span>
        </div>

        <!-- Scrollable Analytics Content -->
        <div class="scroll-content">
          <!-- Top Stats Summary Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrapper focus-time">
                <Clock :size="15" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ formatMinutes(currentStats.totalMinutes) }}</span>
                <span class="stat-label">Focus Time</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper sessions-count">
                <TrendingUp :size="15" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ currentStats.totalSessions }}</span>
                <span class="stat-label">Sessions</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper satisfaction-score">
                <Flame :size="15" />
              </div>
              <div class="stat-info">
                <span class="stat-value">
                  {{
                    currentStats.totalSessions > 0
                      ? Math.round((currentStats.satisfaction.good / currentStats.totalSessions) * 100)
                      : 0
                  }}%
                </span>
                <span class="stat-label">🔥 Good Flow</span>
              </div>
            </div>
          </div>

          <!-- Visual Bar Chart -->
          <div v-if="currentStats.chartData.length > 0" class="chart-section">
            <div class="section-header">
              <span class="section-title">Focus Activity Trend</span>
              <span class="section-meta">{{ formatMinutes(currentStats.totalMinutes) }} logged</span>
            </div>

            <div class="bar-chart-wrapper">
              <div
                v-for="(item, idx) in currentStats.chartData"
                :key="idx"
                class="chart-column"
              >
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      height: `${item.value > 0 ? Math.max(12, Math.round((item.value / maxChartValue) * 100)) : 0}%`,
                    }"
                    :title="`${item.label}: ${item.value} mins`"
                  ></div>
                </div>
                <span class="column-label">{{ item.label }}</span>
                <span v-if="item.secondaryLabel" class="column-sub">{{ item.secondaryLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Category Breakdown Section -->
          <div class="analytics-card">
            <div class="section-header">
              <div class="section-title-with-icon">
                <PieChart :size="13" />
                <span class="section-title">Category Distribution</span>
              </div>
              <span class="section-meta">{{ currentStats.categoryStats.length }} tags</span>
            </div>

            <div v-if="currentStats.categoryStats.length === 0" class="empty-state">
              <span>No focus sessions recorded in this period.</span>
            </div>

            <div v-else class="category-list">
              <div
                v-for="(cat, idx) in currentStats.categoryStats"
                :key="cat.category"
                class="category-row"
              >
                <div class="cat-left">
                  <span class="cat-bullet" :style="{ backgroundColor: getCategoryColor(idx) }"></span>
                  <span class="cat-name">{{ cat.category }}</span>
                  <span class="cat-count">({{ cat.sessionCount }}x)</span>
                </div>
                <div class="cat-right">
                  <span class="cat-time">{{ formatMinutes(cat.totalMinutes) }}</span>
                  <span class="cat-pct">{{ cat.percentage }}%</span>
                </div>
                <div class="cat-progress-track">
                  <div
                    class="cat-progress-fill"
                    :style="{
                      width: `${cat.percentage}%`,
                      backgroundColor: getCategoryColor(idx),
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Session Satisfaction Distribution -->
          <div class="analytics-card">
            <div class="section-header">
              <span class="section-title">Session Satisfaction</span>
              <span class="section-meta">Post-session reflections</span>
            </div>

            <div class="satisfaction-grid">
              <div class="sat-item good">
                <div class="sat-badge">
                  <Flame :size="14" />
                  <span>Good</span>
                </div>
                <span class="sat-num">{{ currentStats.satisfaction.good }}</span>
              </div>

              <div class="sat-item ok">
                <div class="sat-badge">
                  <Meh :size="14" />
                  <span>OK</span>
                </div>
                <span class="sat-num">{{ currentStats.satisfaction.ok }}</span>
              </div>

              <div class="sat-item bad">
                <div class="sat-badge">
                  <Frown :size="14" />
                  <span>Bad</span>
                </div>
                <span class="sat-num">{{ currentStats.satisfaction.bad }}</span>
              </div>
            </div>
          </div>

          <!-- Individual Session Timeline Log -->
          <div class="analytics-card">
            <div class="section-header">
              <span class="section-title">Session Logs ({{ currentStats.sessions.length }})</span>
              <span class="section-meta">Auto-saved to .txt</span>
            </div>

            <div v-if="currentStats.sessions.length === 0" class="empty-state">
              <span>No individual sessions logged yet for this interval.</span>
            </div>

            <div v-else class="session-items">
              <div
                v-for="sess in currentStats.sessions"
                :key="sess.id"
                class="session-row"
              >
                <div class="sess-main">
                  <div class="sess-title-row">
                    <span class="sess-cat-pill">
                      <Tag :size="10" />
                      {{ sess.category }}
                    </span>
                    <span class="sess-time-badge">{{ sess.timeStr }}</span>
                    <span v-if="activeTimeFrame !== 'day'" class="sess-date-badge">{{ sess.dateStr }}</span>
                  </div>
                  <div class="sess-meta-row">
                    <span class="sess-duration">{{ sess.durationMinutes }} mins</span>
                    <span class="sess-dot">•</span>
                    <span
                      class="sess-sat"
                      :class="sess.satisfaction.toLowerCase()"
                    >
                      {{ sess.satisfaction === 'Good' ? '🔥 Good' : sess.satisfaction === 'OK' ? '😐 OK' : '😞 Bad' }}
                    </span>
                  </div>
                </div>

                <button
                  class="sess-delete-btn"
                  title="Remove session"
                  @click="deleteSession(sess.id)"
                >
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: absolute;
  top: 38px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  z-index: 60;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.history-card {
  width: 100%;
  height: 100%;
  max-width: 340px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon-box {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--card);
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.2;
}

.subtitle {
  font-size: 9px;
  color: var(--text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-btn:hover,
.header-btn.active {
  background: var(--accent);
  color: var(--card);
  border-color: var(--accent);
}

.close-icon-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.close-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

/* Raw Log View */
.raw-log-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px;
  overflow: hidden;
}

.raw-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.file-name {
  font-family: monospace;
  font-size: 10px;
  color: var(--accent);
  font-weight: 700;
}

.raw-actions {
  display: flex;
  gap: 6px;
}

.raw-copy-btn,
.raw-open-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text);
  font-size: 9px;
  font-weight: 600;
  padding: 3px 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.raw-copy-btn:hover,
.raw-open-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.raw-log-content {
  flex: 1;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  color: #a6accd;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 9.5px;
  line-height: 1.4;
  overflow-y: auto;
  white-space: pre-wrap;
  user-select: text;
}

/* Dashboard Container */
.dashboard-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-bar {
  display: flex;
  background: rgba(0, 0, 0, 0.25);
  padding: 4px 8px;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 5px 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.navigator-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.all-time-nav {
  justify-content: center;
}

.nav-arrow-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-arrow-btn:hover:not(.disabled) {
  background: var(--accent);
  color: var(--card);
}

.nav-arrow-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.nav-calendar-icon {
  color: var(--accent);
}

.period-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
}

.current-jump-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--card);
  font-weight: 700;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Stats Summary Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.stat-icon-wrapper {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrapper.focus-time {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.stat-icon-wrapper.sessions-count {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.stat-icon-wrapper.satisfaction-score {
  background: rgba(247, 92, 84, 0.15);
  color: var(--accent);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.2;
}

.stat-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
}

/* Chart Section */
.chart-section {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title-with-icon {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
}

.section-meta {
  font-size: 9.5px;
  color: var(--text-muted);
}

.bar-chart-wrapper {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4px;
  height: 70px;
  padding-top: 6px;
}

.chart-column {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.bar-track {
  width: 100%;
  max-width: 20px;
  height: 48px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: var(--accent);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
}

.column-label {
  font-size: 8.5px;
  font-weight: 700;
  color: var(--text-muted);
}

.column-sub {
  font-size: 7.5px;
  color: var(--accent);
  font-weight: 600;
}

/* Analytics Card */
.analytics-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
}

.empty-state {
  padding: 12px;
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
}

/* Category List */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cat-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.cat-name {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text);
}

.cat-count {
  font-size: 9px;
  color: var(--text-muted);
}

.cat-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
}

.cat-progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  overflow: hidden;
}

.cat-progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* Satisfaction Grid */
.satisfaction-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.sat-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sat-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
}

.sat-item.good .sat-badge { color: #f75c54; }
.sat-item.ok .sat-badge { color: #f59e0b; }
.sat-item.bad .sat-badge { color: #64748b; }

.sat-num {
  font-size: 12px;
  font-weight: 800;
  color: var(--text);
}

/* Session Items */
.session-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
}

.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.sess-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sess-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sess-cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9.5px;
  font-weight: 700;
  color: var(--accent);
}

.sess-time-badge,
.sess-date-badge {
  font-size: 8.5px;
  color: var(--text-muted);
}

.sess-meta-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: var(--text-muted);
}

.sess-sat.good { color: #f75c54; font-weight: 700; }
.sess-sat.ok { color: #f59e0b; font-weight: 700; }
.sess-sat.bad { color: #64748b; font-weight: 700; }

.sess-delete-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.sess-delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
</style>
