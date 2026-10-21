<script setup lang="ts">
import { ref, computed } from 'vue';
import { Tag, Plus, Check, ChevronDown } from 'lucide-vue-next';
import { timerState } from '../services/timerEngine';
import { settings } from '../services/store';
import {
  historyStore,
  getAllCategories,
  setActiveCategory,
  addCustomCategory,
} from '../services/sessionHistory';

const formattedTime = computed(() => {
  const mins = Math.floor(timerState.timeLeft / 60);
  const secs = timerState.timeLeft % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

const phaseLabel = computed(() => {
  switch (timerState.phase) {
    case 'work':
      return 'FOCUS';
    case 'short_break':
      return 'SHORT BREAK';
    case 'long_break':
      return 'LONG BREAK';
  }
});

const progressOffset = computed(() => {
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  if (!timerState.totalDuration || timerState.totalDuration <= 0) return 0;
  const progress = timerState.timeLeft / timerState.totalDuration;
  return circumference * (1 - progress);
});

// Category selector state
const isTagMenuOpen = ref(false);
const isCreatingTag = ref(false);
const customTagInput = ref('');

function selectCategory(cat: string) {
  setActiveCategory(cat);
  isTagMenuOpen.value = false;
  isCreatingTag.value = false;
}

function handleAddCustomTag() {
  if (customTagInput.value.trim()) {
    addCustomCategory(customTagInput.value.trim());
    customTagInput.value = '';
    isCreatingTag.value = false;
    isTagMenuOpen.value = false;
  }
}
</script>

<template>
  <div class="timer-container">
    <!-- Top Row: Phase Badge & Active Session Category -->
    <div class="header-row">
      <span class="phase-badge" :class="timerState.phase">
        {{ phaseLabel }}
      </span>

      <!-- Interactive Session Category Pill (Focus Phase) -->
      <div v-if="timerState.phase === 'work'" class="category-pill-wrapper">
        <button
          class="category-pill"
          :class="{ active: isTagMenuOpen }"
          title="Change active focus session category"
          @click="isTagMenuOpen = !isTagMenuOpen"
        >
          <Tag :size="10" />
          <span class="cat-label">{{ historyStore.activeCategory }}</span>
          <ChevronDown :size="10" class="chevron" :class="{ rotate: isTagMenuOpen }" />
        </button>

        <!-- Category Dropdown / Quick Switch Menu -->
        <div v-if="isTagMenuOpen" class="category-menu">
          <div class="menu-title">Select Focus Session</div>

          <div class="categories-list">
            <button
              v-for="cat in getAllCategories()"
              :key="cat"
              class="cat-item-btn"
              :class="{ selected: historyStore.activeCategory === cat }"
              @click="selectCategory(cat)"
            >
              <span class="cat-name">{{ cat }}</span>
              <Check v-if="historyStore.activeCategory === cat" :size="12" class="check-icon" />
            </button>
          </div>

          <!-- Add User Defined Category -->
          <div v-if="isCreatingTag" class="new-tag-box">
            <input
              v-model="customTagInput"
              placeholder="e.g. Thesis, Bugfix..."
              class="new-tag-field"
              @keyup.enter="handleAddCustomTag"
              autofocus
            />
            <button class="new-tag-submit" @click="handleAddCustomTag">Add</button>
          </div>
          <button
            v-else
            class="add-custom-btn"
            @click="isCreatingTag = true"
          >
            <Plus :size="12" />
            <span>Add Custom Tag...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Circular Progress Ring -->
    <div class="ring-wrapper">
      <svg class="progress-svg" viewBox="0 0 220 220">
        <!-- Background Track -->
        <circle
          class="track"
          cx="110"
          cy="110"
          r="95"
          fill="none"
          stroke-width="7"
        />
        <!-- Active Progress Arc -->
        <circle
          class="progress-bar"
          cx="110"
          cy="110"
          r="95"
          fill="none"
          stroke-width="7"
          stroke-linecap="round"
          :stroke-dasharray="2 * Math.PI * 95"
          :stroke-dashoffset="progressOffset"
        />
      </svg>

      <!-- Center Digital Time -->
      <div class="time-display">
        <span class="digits">{{ formattedTime }}</span>
        <span class="cycle-text">Cycle {{ timerState.currentCycle }} of {{ settings.rounds }}</span>
      </div>
    </div>

    <!-- Cycle Dots (Pomotroid Style) -->
    <div class="cycle-dots">
      <span
        v-for="index in settings.rounds"
        :key="index"
        class="dot"
        :class="{
          active: index <= timerState.currentCycle && timerState.phase === 'work',
          completed: index < timerState.currentCycle,
        }"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0 6px;
  user-select: none;
  position: relative;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  position: relative;
}

.phase-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--card);
  background-color: var(--accent);
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.phase-badge.short_break,
.phase-badge.long_break {
  background-color: #38bdf8;
  color: #0f172a;
}

/* Category Pill & Menu */
.category-pill-wrapper {
  position: relative;
}

.category-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 3px 8px;
  color: var(--text);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.category-pill:hover,
.category-pill.active {
  background: rgba(255, 255, 255, 0.14);
  border-color: var(--accent);
  color: var(--accent);
}

.cat-label {
  max-width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.rotate {
  transform: rotate(180deg);
}

.category-menu {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: 170px;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: dropDown 0.15s ease-out;
}

@keyframes dropDown {
  from { opacity: 0; transform: translate(-50%, -6px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.menu-title {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  padding: 2px 4px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 120px;
  overflow-y: auto;
}

.cat-item-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: var(--text);
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s ease;
}

.cat-item-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--accent);
}

.cat-item-btn.selected {
  background: var(--accent);
  color: var(--card);
  font-weight: 700;
}

.check-icon {
  color: var(--card);
}

.add-custom-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: 5px;
  color: var(--text-muted);
  font-size: 9.5px;
  font-weight: 600;
  padding: 4px 6px;
  cursor: pointer;
  margin-top: 2px;
  transition: all 0.12s ease;
}

.add-custom-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.new-tag-box {
  display: flex;
  gap: 3px;
  margin-top: 2px;
}

.new-tag-field {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--accent);
  border-radius: 4px;
  color: var(--text);
  font-size: 9.5px;
  padding: 3px 5px;
  outline: none;
}

.new-tag-submit {
  background: var(--accent);
  color: var(--card);
  border: none;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 700;
  padding: 0 6px;
  cursor: pointer;
}

/* Ring & Progress */
.ring-wrapper {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.track {
  stroke: var(--card);
  opacity: 0.8;
}

.progress-bar {
  stroke: var(--accent);
  transition: stroke-dashoffset 0.35s ease, stroke 0.25s ease;
  filter: drop-shadow(0 0 6px var(--accent));
}

.time-display {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.digits {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 42px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.cycle-text {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  margin-top: -2px;
  letter-spacing: 0.05em;
}

.cycle-dots {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--card);
  border: 1px solid var(--border);
  transition: all 0.25s ease;
}

.dot.active {
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
  border-color: var(--accent);
}

.dot.completed {
  background: var(--accent);
  opacity: 0.5;
  border-color: var(--accent);
}
</style>
