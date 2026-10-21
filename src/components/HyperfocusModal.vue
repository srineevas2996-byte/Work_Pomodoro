<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  BellRing,
  Volume2,
  Clock,
  Coffee,
  Sparkles,
  Wind,
  Eye,
  Activity,
  Droplet,
  Target,
  Zap,
  Flame,
  Meh,
  Frown,
  RotateCw,
  Tag,
  Plus,
} from 'lucide-vue-next';
import { timerState, acknowledgeAlert, snoozeAlert } from '../services/timerEngine';
import { settings } from '../services/store';
import { getRandomQuote, getNextQuote, MotivationalQuote } from '../services/quotes';
import {
  historyStore,
  getAllCategories,
  addCustomCategory,
  logCompletedSession,
  SessionSatisfaction,
} from '../services/sessionHistory';

const isWorkEnded = computed(() => timerState.alertType === 'work_ended');

const currentQuote = ref<MotivationalQuote>(getRandomQuote('work_ended').quote);
const currentQuoteIndex = ref<number>(0);
const isFading = ref(false);
let quoteIntervalId: number | null = null;
const progressKey = ref(0); // Used to restart the 9s CSS progress animation

// Session reflection state
const selectedSatisfaction = ref<SessionSatisfaction>('Good');
const selectedCategory = ref<string>(historyStore.activeCategory || 'Coding');
const isAddingCustomTag = ref(false);
const newCustomTagName = ref('');

function shiftToNextQuote() {
  isFading.value = true;
  setTimeout(() => {
    const next = getNextQuote(
      timerState.alertType === 'work_ended' ? 'work_ended' : 'break_ended',
      currentQuoteIndex.value
    );
    currentQuote.value = next.quote;
    currentQuoteIndex.value = next.nextIndex;
    isFading.value = false;
    progressKey.value += 1;
  }, 180);
}

function startQuoteRotation() {
  stopQuoteRotation();
  const initial = getRandomQuote(
    timerState.alertType === 'work_ended' ? 'work_ended' : 'break_ended'
  );
  currentQuote.value = initial.quote;
  currentQuoteIndex.value = initial.index;
  progressKey.value += 1;

  // Auto-shift to next quotation every 9 seconds
  quoteIntervalId = window.setInterval(() => {
    shiftToNextQuote();
  }, 9000);
}

function stopQuoteRotation() {
  if (quoteIntervalId !== null) {
    clearInterval(quoteIntervalId);
    quoteIntervalId = null;
  }
}

function manualRefreshQuote() {
  stopQuoteRotation();
  shiftToNextQuote();
  // Restart the 9s interval
  quoteIntervalId = window.setInterval(() => {
    shiftToNextQuote();
  }, 9000);
}

function submitNewTag() {
  if (newCustomTagName.value.trim()) {
    addCustomCategory(newCustomTagName.value.trim());
    selectedCategory.value = newCustomTagName.value.trim();
    newCustomTagName.value = '';
    isAddingCustomTag.value = false;
  }
}

async function handleAcknowledge() {
  if (isWorkEnded.value) {
    // Automatically record the session to text log and store
    await logCompletedSession(
      selectedCategory.value,
      settings.workDuration,
      selectedSatisfaction.value
    );
  }
  acknowledgeAlert();
}

// Automatically start/stop shifting quote rotation based on alert state
watch(
  () => timerState.isAlertActive,
  (active) => {
    if (active) {
      selectedSatisfaction.value = 'Good';
      selectedCategory.value = historyStore.activeCategory || 'Coding';
      isAddingCustomTag.value = false;
      startQuoteRotation();
    } else {
      stopQuoteRotation();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopQuoteRotation();
});

const title = computed(() =>
  isWorkEnded.value ? 'Time to Step Away!' : 'Break Time Complete!'
);

const actionLabel = computed(() =>
  isWorkEnded.value ? 'Step Away (Log Session)' : 'Acknowledge & Start Focus'
);
</script>

<template>
  <div v-if="timerState.isAlertActive" class="modal-backdrop">
    <div class="alert-card">
      <!-- Pulsing Alert Badge -->
      <div class="icon-ring" :class="{ 'break-pulse': !isWorkEnded }">
        <Coffee v-if="isWorkEnded" :size="28" class="alert-icon" />
        <Sparkles v-else :size="28" class="alert-icon" />
      </div>

      <!-- Main Header -->
      <h2 class="alert-title">{{ title }}</h2>

      <!-- Active Looping Alarm Indicator -->
      <div class="audio-notice">
        <Volume2 :size="13" class="sound-wave" />
        <span>Alarm is looping until you respond</span>
      </div>

      <!-- Work Session Reflection & Logging Section (Only when focus ends) -->
      <div v-if="isWorkEnded" class="session-rating-box">
        <!-- Category Selector -->
        <div class="category-select-row">
          <div class="label-with-icon">
            <Tag :size="12" />
            <span>Session:</span>
          </div>

          <div v-if="!isAddingCustomTag" class="cat-chips">
            <select
              v-model="selectedCategory"
              class="cat-dropdown"
            >
              <option
                v-for="cat in getAllCategories()"
                :key="cat"
                :value="cat"
              >
                {{ cat }}
              </option>
            </select>
            <button
              class="add-tag-mini-btn"
              title="Add new category"
              @click="isAddingCustomTag = true"
            >
              <Plus :size="12" />
            </button>
          </div>

          <div v-else class="new-tag-input-row">
            <input
              v-model="newCustomTagName"
              placeholder="Tag name..."
              class="new-tag-input"
              @keyup.enter="submitNewTag"
            />
            <button class="tag-save-btn" @click="submitNewTag">OK</button>
            <button class="tag-cancel-btn" @click="isAddingCustomTag = false">✕</button>
          </div>
        </div>

        <!-- Satisfaction Rating Buttons (Bad / OK / Good) -->
        <div class="satisfaction-rating-row">
          <span class="rating-label">Focus Rating:</span>
          <div class="satisfaction-buttons">
            <button
              class="sat-rate-btn bad"
              :class="{ selected: selectedSatisfaction === 'Bad' }"
              title="Rough / Distracted"
              @click="selectedSatisfaction = 'Bad'"
            >
              <Frown :size="14" />
              <span>Bad</span>
            </button>

            <button
              class="sat-rate-btn ok"
              :class="{ selected: selectedSatisfaction === 'OK' }"
              title="Moderate Focus"
              @click="selectedSatisfaction = 'OK'"
            >
              <Meh :size="14" />
              <span>OK</span>
            </button>

            <button
              class="sat-rate-btn good"
              :class="{ selected: selectedSatisfaction === 'Good' }"
              title="Great Flow / Focused"
              @click="selectedSatisfaction = 'Good'"
            >
              <Flame :size="14" />
              <span>Good</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Rectangular Motivational & Wellness Quote Box (Shifts every 9s) -->
      <div class="quote-box">
        <div class="quote-header">
          <div class="quote-badge">
            <Wind v-if="currentQuote.category === 'breathing'" :size="12" />
            <Eye v-else-if="currentQuote.category === 'eyes'" :size="12" />
            <Activity v-else-if="currentQuote.category === 'stretch'" :size="12" />
            <Droplet v-else-if="currentQuote.category === 'water'" :size="12" />
            <Target v-else-if="currentQuote.category === 'focus'" :size="12" />
            <Zap v-else-if="currentQuote.category === 'momentum'" :size="12" />
            <Flame v-else-if="currentQuote.category === 'posture'" :size="12" />
            <Sparkles v-else :size="12" />
            <span>{{ currentQuote.categoryLabel }}</span>
          </div>

          <div class="header-right">
            <span class="timer-tag">9s shift</span>
            <button class="refresh-quote-btn" title="Next tip now" @click="manualRefreshQuote">
              <RotateCw :size="11" />
            </button>
          </div>
        </div>

        <p class="quote-text" :class="{ 'quote-fade': isFading }">
          "{{ currentQuote.text }}"
        </p>

        <!-- 9-Second Progress Bar Line -->
        <div class="progress-track">
          <div :key="progressKey" class="progress-bar-fill"></div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="acknowledge-btn" @click="handleAcknowledge">
          <BellRing :size="15" />
          <span>{{ actionLabel }}</span>
        </button>

        <button
          v-if="timerState.snoozesLeft > 0"
          class="snooze-btn"
          @click="snoozeAlert"
          :title="`Postpone by ${settings.snoozeDuration} minutes (${timerState.snoozesLeft} remaining)`"
        >
          <Clock :size="13" />
          <span>Snooze {{ settings.snoozeDuration }}m ({{ timerState.snoozesLeft }} left)</span>
        </button>
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
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  z-index: 50;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.alert-card {
  width: 100%;
  max-width: 324px;
  max-height: 100%;
  overflow-y: auto;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px var(--accent);
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleUp {
  from {
    transform: scale(0.94);
  }
  to {
    transform: scale(1);
  }
}

.icon-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--card);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 0 16px var(--accent);
  animation: pulseAlarm 1.4s infinite;
  flex-shrink: 0;
}

.icon-ring.break-pulse {
  background: #38bdf8;
  color: #09090b;
  box-shadow: 0 0 16px #38bdf8;
}

@keyframes pulseAlarm {
  0% {
    transform: scale(0.96);
    box-shadow: 0 0 0 0 rgba(255, 84, 73, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 12px rgba(255, 84, 73, 0);
  }
  100% {
    transform: scale(0.96);
    box-shadow: 0 0 0 0 rgba(255, 84, 73, 0);
  }
}

.alert-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
}

.audio-notice {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
  padding: 3px 8px;
  border-radius: 9999px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
}

.sound-wave {
  animation: soundBounce 0.8s infinite alternate;
}

@keyframes soundBounce {
  from {
    transform: scale(0.9);
  }
  to {
    transform: scale(1.2);
  }
}

/* Session Reflection Box */
.session-rating-box {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 8px 10px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.category-select-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.label-with-icon {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
}

.cat-chips {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-dropdown {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  outline: none;
  cursor: pointer;
}

.cat-dropdown option {
  background: #1e1e2e;
  color: #fff;
}

.add-tag-mini-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-muted);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-tag-mini-btn:hover {
  background: var(--accent);
  color: var(--card);
}

.new-tag-input-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.new-tag-input {
  width: 80px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--accent);
  border-radius: 5px;
  color: var(--text);
  font-size: 9.5px;
  padding: 2px 5px;
  outline: none;
}

.tag-save-btn,
.tag-cancel-btn {
  background: var(--accent);
  border: none;
  border-radius: 4px;
  color: var(--card);
  font-size: 9px;
  font-weight: 800;
  padding: 2px 5px;
  cursor: pointer;
}

.tag-cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.satisfaction-rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.rating-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
}

.satisfaction-buttons {
  display: flex;
  gap: 4px;
}

.sat-rate-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sat-rate-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

.sat-rate-btn.selected.good {
  background: #f75c54;
  color: #fff;
  border-color: #f75c54;
}

.sat-rate-btn.selected.ok {
  background: #f59e0b;
  color: #fff;
  border-color: #f59e0b;
}

.sat-rate-btn.selected.bad {
  background: #64748b;
  color: #fff;
  border-color: #64748b;
}

/* Rectangular Shifting Quote Box */
.quote-box {
  width: 100%;
  background: rgba(0, 0, 0, 0.28);
  border: 1.5px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: 9px;
  padding: 8px 10px 6px;
  margin-bottom: 12px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.quote-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quote-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.timer-tag {
  font-size: 8.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.refresh-quote-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.refresh-quote-btn:hover {
  color: var(--text);
  transform: rotate(90deg);
}

.quote-text {
  font-size: 11px;
  line-height: 1.4;
  color: var(--text);
  font-weight: 500;
  margin: 0;
  min-height: 30px;
  transition: opacity 0.18s ease;
}

.quote-text.quote-fade {
  opacity: 0;
}

/* 9-Second Visual Progress Indicator */
.progress-track {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 3px;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent);
  width: 0%;
  animation: fillProgress 9s linear infinite;
}

@keyframes fillProgress {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

.action-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.acknowledge-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: var(--accent);
  color: var(--card);
  font-size: 12px;
  font-weight: 800;
  padding: 8px 12px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: all 0.15s ease;
}

.acknowledge-btn:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
}

.snooze-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: transparent;
  color: var(--text-muted);
  font-size: 10.5px;
  font-weight: 600;
  padding: 5px 8px;
  border-radius: 7px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s ease;
}

.snooze-btn:hover {
  color: var(--text);
  border-color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
}
</style>
