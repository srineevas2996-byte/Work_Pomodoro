import { reactive, watch } from 'vue';
import { THEMES, Theme } from './themes';
import { SoundPreset } from './soundEngine';

export interface AppSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  rounds: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  alwaysOnTop: boolean;
  soundPreset: SoundPreset;
  soundVolume: number;
  soundLoopInterval: number; // in seconds
  customAudioDataUrl?: string;
  themeId: string;
  hyperfocusStrict: boolean;
  maxSnoozeCount: number;
  snoozeDuration: number; // in minutes
  minimizeOnStart: boolean;
}

const STORAGE_KEY = 'work_pomodoro_settings_v1';

const defaultSettings: AppSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  rounds: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  alwaysOnTop: false,
  soundPreset: 'bell',
  soundVolume: 0.85,
  soundLoopInterval: 2.5,
  themeId: 'classic',
  hyperfocusStrict: true,
  maxSnoozeCount: 1,
  snoozeDuration: 2,
  minimizeOnStart: true,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...defaultSettings };
}

export const settings = reactive<AppSettings>(loadSettings());

export function getActiveTheme(): Theme {
  return THEMES.find((t) => t.id === settings.themeId) || THEMES[0];
}

export function applyThemeVariables() {
  const t = getActiveTheme();
  const root = document.documentElement;
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--card', t.card);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-hover', t.accentHover);
  root.style.setProperty('--text', t.text);
  root.style.setProperty('--text-muted', t.textMuted);
  root.style.setProperty('--border', t.border);
  root.style.setProperty('--ring', t.ring);
}

// Automatically persist on changes
watch(
  settings,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
      applyThemeVariables();
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },
  { deep: true }
);
