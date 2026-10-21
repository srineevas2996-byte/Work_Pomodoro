<script setup lang="ts">
import { ref } from 'vue';
import { Pin, Settings, Minus, X, Volume2, VolumeX, BarChart2 } from 'lucide-vue-next';
import { settings } from '../services/store';
import { setAlwaysOnTop, minimizeWindow, minimizeToTray } from '../services/tauriBridge';

const props = defineProps<{
  isSettingsOpen: boolean;
  isHistoryOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleSettings'): void;
  (e: 'toggleHistory'): void;
}>();

const isPinned = ref(settings.alwaysOnTop);

async function togglePin() {
  isPinned.value = !isPinned.value;
  settings.alwaysOnTop = isPinned.value;
  await setAlwaysOnTop(isPinned.value);
}

function toggleMute() {
  if (settings.soundVolume > 0) {
    (settings as any)._prevVolume = settings.soundVolume;
    settings.soundVolume = 0;
  } else {
    settings.soundVolume = (settings as any)._prevVolume || 0.85;
  }
}
</script>

<template>
  <header class="titlebar" data-tauri-drag-region>
    <!-- Left: App Icon & Title -->
    <div class="brand" data-tauri-drag-region>
      <img src="/app-icon.png" alt="App Logo" class="brand-logo" />
      <span class="brand-title">Work Pomodoro</span>
    </div>

    <!-- Right: Window Actions -->
    <div class="actions">
      <!-- Session History & Analytics -->
      <button
        class="icon-btn"
        :class="{ active: props.isHistoryOpen }"
        title="Session History & Analytics"
        @click="emit('toggleHistory')"
      >
        <BarChart2 :size="14" />
      </button>

      <!-- Pin / Always on top -->
      <button
        class="icon-btn"
        :class="{ active: isPinned }"
        :title="isPinned ? 'Always on Top: ON' : 'Always on Top: OFF'"
        @click="togglePin"
      >
        <Pin :size="14" :class="{ 'rotate-45': isPinned }" />
      </button>

      <!-- Mute / Unmute -->
      <button
        class="icon-btn"
        :class="{ muted: settings.soundVolume === 0 }"
        :title="settings.soundVolume === 0 ? 'Unmute Alarm' : 'Mute Alarm'"
        @click="toggleMute"
      >
        <VolumeX v-if="settings.soundVolume === 0" :size="14" />
        <Volume2 v-else :size="14" />
      </button>

      <!-- Settings Toggle -->
      <button
        class="icon-btn"
        :class="{ active: props.isSettingsOpen }"
        title="Settings & Themes"
        @click="emit('toggleSettings')"
      >
        <Settings :size="14" />
      </button>

      <!-- Minimize Window -->
      <button class="icon-btn" title="Minimize" @click="minimizeWindow">
        <Minus :size="14" />
      </button>

      <!-- Close to Tray -->
      <button class="icon-btn close-btn" title="Close to System Tray" @click="minimizeToTray">
        <X :size="14" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 10px;
  background-color: var(--card);
  user-select: none;
  border-bottom: 1px solid var(--border);
  transition: background-color 0.25s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: grab;
}

.brand:active {
  cursor: grabbing;
}

.brand-logo {
  width: 17px;
  height: 17px;
  border-radius: 4px;
  object-fit: cover;
  box-shadow: 0 0 6px rgba(247, 92, 84, 0.45);
}

.brand-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

.icon-btn.active {
  color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
}

.icon-btn.muted {
  color: #ef4444;
}

.close-btn:hover {
  background: #e11d48;
  color: #ffffff;
}

.rotate-45 {
  transform: rotate(45deg);
}
</style>
