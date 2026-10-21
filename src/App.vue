<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import TitleBar from './components/TitleBar.vue';
import TimerDisplay from './components/TimerDisplay.vue';
import Controls from './components/Controls.vue';
import HyperfocusModal from './components/HyperfocusModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import HistoryModal from './components/HistoryModal.vue';
import { applyThemeVariables } from './services/store';
import { updateDocumentTitle } from './services/timerEngine';
import { initUniversalDesktop } from './services/tauriBridge';

const isSettingsOpen = ref(false);
const isHistoryOpen = ref(false);

const scale = ref(1);

function updateScale() {
  const baseW = 360;
  const baseH = 540;
  const currentW = window.innerWidth;
  const currentH = window.innerHeight;
  const s = Math.min(currentW / baseW, currentH / baseH);
  scale.value = Math.max(0.5, s);
}

onMounted(async () => {
  applyThemeVariables();
  updateDocumentTitle();
  updateScale();
  window.addEventListener('resize', updateScale);
  // Automatically pin window to all desktops on launch (Task View / Spaces parity)
  await initUniversalDesktop();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScale);
});

function toggleSettings() {
  isSettingsOpen.value = !isSettingsOpen.value;
  if (isSettingsOpen.value) isHistoryOpen.value = false;
}

function toggleHistory() {
  isHistoryOpen.value = !isHistoryOpen.value;
  if (isHistoryOpen.value) isSettingsOpen.value = false;
}

</script>

<template>
  <div class="window-shell">
    <div
      class="app-root"
      :style="{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }"
    >
      <!-- Sleek Custom Titlebar with Drag Region & Window Controls -->
      <TitleBar
        :is-settings-open="isSettingsOpen"
        :is-history-open="isHistoryOpen"
        @toggle-settings="toggleSettings"
        @toggle-history="toggleHistory"
      />

      <!-- Main Content Area -->
      <main class="main-content">
        <TimerDisplay />
        <Controls />
      </main>

      <!-- Foreground Hyperfocus Alarm Modal -->
      <HyperfocusModal />

      <!-- Session Analytics & History Dashboard -->
      <HistoryModal
        v-if="isHistoryOpen"
        @close="isHistoryOpen = false"
      />

      <!-- Preferences & Theme Customization Drawer -->
      <SettingsModal
        v-if="isSettingsOpen"
        @close="isSettingsOpen = false"
      />
    </div>
  </div>
</template>

<style>
/* Global resets & typography */
:root {
  --bg: #1a1b26;
  --card: #24283b;
  --accent: #f75c54;
  --accent-hover: #ff7069;
  --text: #c0caf5;
  --text-muted: #565f89;
  --border: #2f354f;
  --ring: #f75c54;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  overflow: hidden;
  user-select: none;
  width: 100vw;
  height: 100vh;
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>

<style scoped>
.window-shell {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg);
  overflow: hidden;
  position: relative;
}

.app-root {
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 540px;
  min-width: 360px;
  min-height: 540px;
  max-width: 360px;
  max-height: 540px;
  background-color: var(--bg);
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px 0;
}
</style>