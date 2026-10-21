import { invoke } from '@tauri-apps/api/core';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function initUniversalDesktop(): Promise<boolean> {
  if (isTauri()) {
    try {
      const res = await invoke<boolean>('init_universal_desktop');
      return res;
    } catch (err) {
      console.warn('Failed to init universal desktop:', err);
    }
  }
  return false;
}

export async function forceForegroundWindow(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('force_foreground');
    } catch (err) {
      console.warn('Failed to force foreground:', err);
    }
  } else {
    console.log('[Dev Browser] forceForegroundWindow called');
  }
}

export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('set_window_always_on_top', { alwaysOnTop });
    } catch (err) {
      console.warn('Failed to set always on top:', err);
    }
  } else {
    console.log('[Dev Browser] setAlwaysOnTop:', alwaysOnTop);
  }
}

export async function minimizeToTray(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('hide_window');
    } catch (err) {
      console.warn('Failed to hide window to tray:', err);
    }
  } else {
    console.log('[Dev Browser] minimizeToTray called');
  }
}

export async function minimizeWindow(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('minimize_window');
    } catch (err) {
      console.warn('Failed to minimize window:', err);
    }
  } else {
    console.log('[Dev Browser] minimizeWindow called');
  }
}

export async function closeApplication(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('close_app');
    } catch (err) {
      console.warn('Failed to close app:', err);
    }
  } else {
    console.log('[Dev Browser] closeApplication called');
  }
}

export async function logSessionToFile(entry: string): Promise<string> {
  if (isTauri()) {
    try {
      return await invoke<string>('log_session_to_file', { entry });
    } catch (err) {
      console.warn('Failed to log session to file via Tauri:', err);
    }
  } else {
    console.log('[Dev Browser Text Log Entry]:', entry);
  }
  return '';
}

export async function openLogFile(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('open_log_file');
    } catch (err) {
      console.warn('Failed to open log file via Tauri:', err);
    }
  } else {
    console.log('[Dev Browser] openLogFile called');
    alert('Log file is located in app_data_dir/work_pomodoro_sessions.txt in the native desktop app.');
  }
}

export async function getLogFileContent(): Promise<string> {
  if (isTauri()) {
    try {
      return await invoke<string>('get_log_file_content');
    } catch (err) {
      console.warn('Failed to get log file content via Tauri:', err);
    }
  }
  return 'Browser Mode: See LocalStorage session history.';
}

