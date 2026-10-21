<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-vue-next';
import {
  timerState,
  startTimer,
  pauseTimer,
  resetTimer,
  resetEntireSession,
  skipPhase,
} from '../services/timerEngine';

const isResetArmed = ref(false);
const resetFeedback = ref<string | null>(null);
let resetClickTimeout: number | null = null;
let feedbackTimeout: number | null = null;

function handleReset() {
  if (isResetArmed.value) {
    // 2nd click: Reset entire session!
    if (resetClickTimeout !== null) {
      clearTimeout(resetClickTimeout);
      resetClickTimeout = null;
    }
    isResetArmed.value = false;
    resetEntireSession();
    triggerFeedback('Session Reset (Cycle 1)');
  } else {
    // 1st click: Reset current timer
    resetTimer();
    isResetArmed.value = true;
    triggerFeedback('Click again to reset session');
    resetClickTimeout = window.setTimeout(() => {
      isResetArmed.value = false;
      resetClickTimeout = null;
    }, 2500);
  }
}

function triggerFeedback(msg: string) {
  resetFeedback.value = msg;
  if (feedbackTimeout !== null) {
    clearTimeout(feedbackTimeout);
  }
  feedbackTimeout = window.setTimeout(() => {
    resetFeedback.value = null;
    feedbackTimeout = null;
  }, 2200);
}

onUnmounted(() => {
  if (resetClickTimeout !== null) clearTimeout(resetClickTimeout);
  if (feedbackTimeout !== null) clearTimeout(feedbackTimeout);
});

function togglePlay() {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}
</script>

<template>
  <div class="controls-wrapper">
    <!-- Floating Micro Feedback Pill -->
    <transition name="fade-slide">
      <div v-if="resetFeedback" class="reset-feedback-pill">
        {{ resetFeedback }}
      </div>
    </transition>

    <div class="controls-container">
      <!-- Reset Button (1-click: reset timer, 2-clicks: reset entire session) -->
      <button
        class="secondary-btn"
        :class="{ armed: isResetArmed }"
        :title="
          isResetArmed
            ? 'Click again to reset entire session (Cycle 1 & Focus)'
            : 'Reset current timer (Click twice to reset session)'
        "
        @click="handleReset"
      >
        <RotateCcw :size="18" :class="{ 'spin-hint': isResetArmed }" />
      </button>

      <!-- Main Play/Pause Button -->
      <button
        class="primary-btn"
        :class="{ running: timerState.isRunning }"
        :title="timerState.isRunning ? 'Pause' : 'Start Focus'"
        @click="togglePlay"
      >
        <Pause v-if="timerState.isRunning" :size="24" />
        <Play v-else :size="24" class="ml-1" />
      </button>

      <!-- Skip Button -->
      <button class="secondary-btn" title="Skip to Next Phase" @click="skipPhase">
        <SkipForward :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.controls-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
}

.reset-feedback-pill {
  position: absolute;
  top: -10px;
  font-size: 9px;
  font-weight: 700;
  color: var(--accent);
  background: var(--card);
  border: 1px solid var(--accent);
  padding: 2px 9px;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  z-index: 10;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.controls-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 12px 0 20px;
}

.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background-color: var(--accent);
  color: var(--card);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25), 0 0 16px var(--accent);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.primary-btn:hover {
  transform: scale(1.06);
  background-color: var(--accent-hover);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 22px var(--accent-hover);
}

.primary-btn:active {
  transform: scale(0.96);
}

.secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.secondary-btn:hover {
  color: var(--text);
  border-color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}

.secondary-btn:active {
  transform: translateY(1px);
}

.secondary-btn.armed {
  color: var(--accent);
  border-color: var(--accent);
  background: rgba(247, 92, 84, 0.12);
  box-shadow: 0 0 10px var(--accent);
  animation: pulseArmed 1s infinite alternate;
}

@keyframes pulseArmed {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.08);
  }
}

.spin-hint {
  transform: rotate(-30deg);
  transition: transform 0.2s ease;
}

.ml-1 {
  margin-left: 2px;
}
</style>
