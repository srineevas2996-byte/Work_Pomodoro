<script setup lang="ts">
import { ref } from 'vue';
import { X, Play, Square, Upload, Check } from 'lucide-vue-next';
import { settings } from '../services/store';
import { syncDurationChanges } from '../services/timerEngine';
import { soundEngine, SoundPreset } from '../services/soundEngine';
import { THEMES } from '../services/themes';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const activeTab = ref<'timers' | 'audio' | 'themes' | 'rules'>('timers');
const isTestingAudio = ref(false);
const customFileName = ref<string>('');

function handleDurationChange() {
  syncDurationChanges();
}

function testAlarm() {
  if (isTestingAudio.value) {
    soundEngine.stopAlarmLoop();
    isTestingAudio.value = false;
  } else {
    isTestingAudio.value = true;
    soundEngine.startAlarmLoop(
      settings.soundPreset,
      settings.soundVolume,
      settings.soundLoopInterval,
      settings.customAudioDataUrl
    );
  }
}

function stopTest() {
  soundEngine.stopAlarmLoop();
  isTestingAudio.value = false;
}

function handleCustomAudioUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    customFileName.value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      settings.customAudioDataUrl = e.target?.result as string;
      settings.soundPreset = 'custom';
    };
    reader.readAsDataURL(file);
  }
}

const presets: { id: SoundPreset; label: string }[] = [
  { id: 'bell', label: 'Tubular Bell' },
  { id: 'digital', label: 'Digital Alarm' },
  { id: 'bowl', label: 'Singing Bowl' },
  { id: 'retro', label: 'Retro 8-Bit' },
  { id: 'custom', label: 'Custom Audio File' },
];
</script>

<template>
  <div class="settings-drawer">
    <!-- Header -->
    <div class="drawer-header">
      <h3 class="drawer-title">Preferences</h3>
      <button class="close-btn" @click="emit('close'); stopTest();">
        <X :size="16" />
      </button>
    </div>

    <!-- Tab navigation -->
    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'timers' }"
        @click="activeTab = 'timers'"
      >
        Timers
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'audio' }"
        @click="activeTab = 'audio'"
      >
        Audio
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'themes' }"
        @click="activeTab = 'themes'"
      >
        Themes
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'rules' }"
        @click="activeTab = 'rules'"
      >
        Rules
      </button>
    </div>

    <!-- Tab Content -->
    <div class="drawer-body">
      <!-- 1. TIMERS TAB -->
      <div v-if="activeTab === 'timers'" class="tab-pane">
        <div class="form-group">
          <label>Work Duration (minutes)</label>
          <input
            v-model.number="settings.workDuration"
            type="number"
            min="1"
            max="120"
            @change="handleDurationChange"
          />
        </div>

        <div class="form-group">
          <label>Short Break (minutes)</label>
          <input
            v-model.number="settings.shortBreakDuration"
            type="number"
            min="1"
            max="60"
            @change="handleDurationChange"
          />
        </div>

        <div class="form-group">
          <label>Long Break (minutes)</label>
          <input
            v-model.number="settings.longBreakDuration"
            type="number"
            min="1"
            max="60"
            @change="handleDurationChange"
          />
        </div>

        <div class="form-group">
          <label>Rounds Before Long Break</label>
          <input
            v-model.number="settings.rounds"
            type="number"
            min="1"
            max="12"
          />
        </div>
      </div>

      <!-- 2. AUDIO & HYPERFOCUS TAB -->
      <div v-if="activeTab === 'audio'" class="tab-pane">
        <div class="form-group">
          <label>Alarm Tone</label>
          <select v-model="settings.soundPreset">
            <option v-for="p in presets" :key="p.id" :value="p.id">
              {{ p.label }}
            </option>
          </select>
        </div>

        <!-- Custom audio file uploader -->
        <div v-if="settings.soundPreset === 'custom'" class="form-group">
          <label>Upload Custom Sound (.mp3, .wav, .ogg)</label>
          <label class="file-upload-box">
            <Upload :size="16" />
            <span>{{ customFileName || (settings.customAudioDataUrl ? 'Custom sound loaded' : 'Choose audio file...') }}</span>
            <input
              type="file"
              accept="audio/*"
              class="hidden-input"
              @change="handleCustomAudioUpload"
            />
          </label>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label>Alarm Volume</label>
            <span class="value-badge">{{ Math.round(settings.soundVolume * 100) }}%</span>
          </div>
          <input
            v-model.number="settings.soundVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
          />
        </div>

        <div class="form-group">
          <label>Alarm Loop Repetition Interval</label>
          <select v-model.number="settings.soundLoopInterval">
            <option :value="1.5">Every 1.5 seconds (Urgent)</option>
            <option :value="2.5">Every 2.5 seconds (Default)</option>
            <option :value="4.0">Every 4.0 seconds (Gentle)</option>
            <option :value="6.0">Every 6.0 seconds (Spaced)</option>
          </select>
        </div>

        <!-- Audio preview button -->
        <button
          class="test-btn"
          :class="{ playing: isTestingAudio }"
          @click="testAlarm"
        >
          <Square v-if="isTestingAudio" :size="14" />
          <Play v-else :size="14" />
          <span>{{ isTestingAudio ? 'Stop Alarm Test' : 'Test Alarm Loop' }}</span>
        </button>
      </div>

      <!-- 3. THEMES TAB -->
      <div v-if="activeTab === 'themes'" class="tab-pane">
        <div class="theme-grid">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            class="theme-card"
            :class="{ active: settings.themeId === theme.id }"
            :style="{ background: theme.card, borderColor: theme.border }"
            @click="settings.themeId = theme.id"
          >
            <div class="theme-preview">
              <span class="preview-dot" :style="{ background: theme.accent }"></span>
              <span class="preview-text" :style="{ color: theme.text }">{{ theme.name }}</span>
            </div>
            <Check v-if="settings.themeId === theme.id" :size="14" :style="{ color: theme.accent }" />
          </button>
        </div>
      </div>

      <!-- 4. RULES TAB -->
      <div v-if="activeTab === 'rules'" class="tab-pane">
        <label class="checkbox-row">
          <input v-model="settings.hyperfocusStrict" type="checkbox" />
          <div class="checkbox-info">
            <span class="checkbox-title">Enforce Break Takeover</span>
            <span class="checkbox-desc">Window forcibly steals focus & loops alarm until break acknowledged</span>
          </div>
        </label>

        <label class="checkbox-row">
          <input v-model="settings.autoStartBreaks" type="checkbox" />
          <div class="checkbox-info">
            <span class="checkbox-title">Auto-start Breaks</span>
            <span class="checkbox-desc">Starts break timer immediately upon alert confirmation</span>
          </div>
        </label>

        <label class="checkbox-row">
          <input v-model="settings.autoStartWork" type="checkbox" />
          <div class="checkbox-info">
            <span class="checkbox-title">Auto-start Work Sessions</span>
            <span class="checkbox-desc">Starts next focus cycle automatically when break ends</span>
          </div>
        </label>

        <label class="checkbox-row">
          <input v-model="settings.minimizeOnStart" type="checkbox" />
          <div class="checkbox-info">
            <span class="checkbox-title">Auto-minimize on Start</span>
            <span class="checkbox-desc">Minimizes window when timer starts or auto-resumes</span>
          </div>
        </label>

        <div class="form-group mt-3">
          <label>Max Snoozes Allowed per Break</label>
          <input
            v-model.number="settings.maxSnoozeCount"
            type="number"
            min="0"
            max="3"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-drawer {
  position: absolute;
  top: 38px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg);
  display: flex;
  flex-direction: column;
  z-index: 40;
  user-select: none;
  animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: var(--card);
  border-bottom: 1px solid var(--border);
}

.drawer-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

.tabs {
  display: flex;
  background-color: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 0 8px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 8px 4px;
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text);
}

.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
}

input[type="number"],
select {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 8px 10px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

input[type="number"]:focus,
select:focus {
  border-color: var(--accent);
}

input[type="range"] {
  accent-color: var(--accent);
  cursor: pointer;
}

.file-upload-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 10px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.file-upload-box:hover {
  border-color: var(--accent);
  color: var(--text);
}

.hidden-input {
  display: none;
}

.test-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--card);
  border: 1px solid var(--accent);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  padding: 9px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 4px;
}

.test-btn:hover {
  background: var(--accent);
  color: var(--card);
}

.test-btn.playing {
  background: #e11d48;
  border-color: #e11d48;
  color: #ffffff;
}

.theme-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  border-width: 1.5px;
  border-style: solid;
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-card:hover {
  transform: translateX(2px);
}

.theme-card.active {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
}

.theme-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
}

.preview-text {
  font-size: 12px;
  font-weight: 600;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.checkbox-row input {
  margin-top: 3px;
  accent-color: var(--accent);
  cursor: pointer;
}

.checkbox-info {
  display: flex;
  flex-direction: column;
}

.checkbox-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
}

.checkbox-desc {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.35;
}

.mt-3 {
  margin-top: 10px;
}
</style>
