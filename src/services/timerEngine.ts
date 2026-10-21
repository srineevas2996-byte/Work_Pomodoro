import { reactive } from 'vue';
import { settings } from './store';
import { soundEngine } from './soundEngine';
import { forceForegroundWindow, minimizeWindow } from './tauriBridge';

export type PomodoroPhase = 'work' | 'short_break' | 'long_break';

export interface TimerState {
  phase: PomodoroPhase;
  isRunning: boolean;
  timeLeft: number; // in seconds
  totalDuration: number; // in seconds
  currentCycle: number; // 1..rounds
  isAlertActive: boolean;
  alertType: 'work_ended' | 'break_ended' | null;
  snoozesLeft: number;
}

export const timerState = reactive<TimerState>({
  phase: 'work',
  isRunning: false,
  timeLeft: settings.workDuration * 60,
  totalDuration: settings.workDuration * 60,
  currentCycle: 1,
  isAlertActive: false,
  alertType: null,
  snoozesLeft: settings.maxSnoozeCount,
});

let intervalId: number | null = null;
let targetEndTime: number | null = null;

function getPhaseDuration(phase: PomodoroPhase): number {
  switch (phase) {
    case 'work':
      return settings.workDuration * 60;
    case 'short_break':
      return settings.shortBreakDuration * 60;
    case 'long_break':
      return settings.longBreakDuration * 60;
  }
}

export function updateDocumentTitle() {
  const mins = Math.floor(timerState.timeLeft / 60);
  const secs = timerState.timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const phaseLabel =
    timerState.phase === 'work'
      ? 'Focus'
      : timerState.phase === 'short_break'
      ? 'Short Break'
      : 'Long Break';
  document.title = `${timeStr} • ${phaseLabel} | Work Pomodoro`;
}

export function startTimer(autoMinimize = true) {
  if (timerState.isRunning) return;

  targetEndTime = Date.now() + timerState.timeLeft * 1000;
  timerState.isRunning = true;

  if (autoMinimize && settings.minimizeOnStart) {
    minimizeWindow();
  }

  if (intervalId !== null) clearInterval(intervalId);

  intervalId = window.setInterval(() => {
    if (!targetEndTime) return;
    const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
    timerState.timeLeft = remaining;
    updateDocumentTitle();

    if (remaining <= 0) {
      handleTimerExpired();
    }
  }, 250);
}

export function pauseTimer() {
  timerState.isRunning = false;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  targetEndTime = null;
}

export function resetTimer() {
  pauseTimer();
  timerState.timeLeft = getPhaseDuration(timerState.phase);
  timerState.totalDuration = timerState.timeLeft;
  updateDocumentTitle();
}

export function resetEntireSession() {
  pauseTimer();
  soundEngine.stopAlarmLoop();
  timerState.phase = 'work';
  timerState.currentCycle = 1;
  timerState.snoozesLeft = settings.maxSnoozeCount;
  timerState.isAlertActive = false;
  timerState.alertType = null;
  timerState.timeLeft = settings.workDuration * 60;
  timerState.totalDuration = timerState.timeLeft;
  updateDocumentTitle();
}

export function skipPhase() {
  pauseTimer();
  advanceToNextPhase();
}

function advanceToNextPhase() {
  if (timerState.phase === 'work') {
    if (timerState.currentCycle >= settings.rounds) {
      timerState.phase = 'long_break';
    } else {
      timerState.phase = 'short_break';
    }
  } else {
    // Break completed, back to work
    if (timerState.phase === 'long_break') {
      timerState.currentCycle = 1;
    } else {
      timerState.currentCycle = Math.min(settings.rounds, timerState.currentCycle + 1);
    }
    timerState.phase = 'work';
  }

  timerState.snoozesLeft = settings.maxSnoozeCount;
  timerState.timeLeft = getPhaseDuration(timerState.phase);
  timerState.totalDuration = timerState.timeLeft;
  updateDocumentTitle();
}

/**
 * Trigger the hyperfocus breaker alarm and bring window aggressively to the foreground
 */
async function handleTimerExpired() {
  pauseTimer();

  const isWorkDone = timerState.phase === 'work';
  timerState.alertType = isWorkDone ? 'work_ended' : 'break_ended';
  timerState.isAlertActive = true;

  // 1. Force the desktop window to front, unminimize, and demand focus
  await forceForegroundWindow();

  // 2. Start looping audio chime until user actively acknowledges
  soundEngine.startAlarmLoop(
    settings.soundPreset,
    settings.soundVolume,
    settings.soundLoopInterval,
    settings.customAudioDataUrl
  );
}

/**
 * User clicked "Acknowledge" button in the foreground popup
 */
export function acknowledgeAlert() {
  soundEngine.stopAlarmLoop();
  timerState.isAlertActive = false;

  const wasWork = timerState.phase === 'work';
  advanceToNextPhase();

  if (wasWork && settings.autoStartBreaks) {
    startTimer();
  } else if (!wasWork && settings.autoStartWork) {
    startTimer();
  }
}

/**
 * Snooze option for break: strictly limited to maxSnoozeCount
 */
export function snoozeAlert() {
  if (timerState.snoozesLeft <= 0) return;

  soundEngine.stopAlarmLoop();
  timerState.isAlertActive = false;
  timerState.snoozesLeft -= 1;

  // Add snooze duration to current timer
  timerState.timeLeft = settings.snoozeDuration * 60;
  timerState.totalDuration = timerState.timeLeft;
  startTimer();
}

export function syncDurationChanges() {
  if (!timerState.isRunning && !timerState.isAlertActive) {
    timerState.timeLeft = getPhaseDuration(timerState.phase);
    timerState.totalDuration = timerState.timeLeft;
    updateDocumentTitle();
  }
}
