/**
 * Sound Engine for Work_Pomodoro
 * Features:
 * - Synthesized sound presets via Web Audio API (Bell, Digital, Harmonic Bowl, Retro)
 * - Custom user audio playback (.mp3, .wav, .ogg)
 * - Continuous notification loop that only stops when explicitly cancelled
 */

export type SoundPreset = 'bell' | 'digital' | 'bowl' | 'retro' | 'custom';

export class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private loopIntervalId: number | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private isCurrentlyPlaying = false;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play a single chime burst based on the preset
   */
  public playTone(preset: SoundPreset, volume = 0.8, customAudioDataUrl?: string) {
    if (preset === 'custom' && customAudioDataUrl) {
      try {
        const audio = new Audio(customAudioDataUrl);
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play().catch(e => console.warn('Could not play custom audio:', e));
      } catch (err) {
        console.error('Error playing custom audio:', err);
      }
      return;
    }

    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.7, now);
    masterGain.connect(ctx.destination);

    switch (preset) {
      case 'digital': {
        // High pitch dual electronic beep
        [880, 1174].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.2);
        });
        break;
      }
      case 'bowl': {
        // Resonant Tibetan singing bowl harmonics
        const frequencies = [261.63, 523.25, 784.88, 1046.5];
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          const weight = 1 / (idx + 1);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.4 * weight, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 2.3);
        });
        break;
      }
      case 'retro': {
        // 8-bit arpeggio chime
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.2, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.26);
        });
        break;
      }
      case 'bell':
      default: {
        // Elegant tubular bell chord
        const bellNotes = [587.33, 880.0, 1318.51];
        bellNotes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 1.7);
        });
        break;
      }
    }
  }

  /**
   * Start looping the alarm continuously until stopAlarmLoop() is called.
   * Repeats every `intervalSeconds` (default: 2.5s) to guarantee breaking hyperfocus.
   */
  public startAlarmLoop(
    preset: SoundPreset,
    volume = 0.8,
    intervalSeconds = 2.5,
    customAudioDataUrl?: string
  ) {
    this.stopAlarmLoop();
    this.isCurrentlyPlaying = true;

    if (preset === 'custom' && customAudioDataUrl) {
      try {
        this.customAudioElement = new Audio(customAudioDataUrl);
        this.customAudioElement.loop = true;
        this.customAudioElement.volume = Math.max(0, Math.min(1, volume));
        this.customAudioElement.play().catch(e => console.warn('Audio play loop blocked:', e));
        return;
      } catch (err) {
        console.error('Failed to loop custom audio:', err);
      }
    }

    // Play first burst immediately
    this.playTone(preset, volume, customAudioDataUrl);

    // Schedule repetitive chime
    const ms = Math.max(1000, intervalSeconds * 1000);
    this.loopIntervalId = window.setInterval(() => {
      if (!this.isCurrentlyPlaying) {
        this.stopAlarmLoop();
        return;
      }
      this.playTone(preset, volume, customAudioDataUrl);
    }, ms);
  }

  /**
   * Stop the looping alarm immediately
   */
  public stopAlarmLoop() {
    this.isCurrentlyPlaying = false;
    if (this.loopIntervalId !== null) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement.currentTime = 0;
      this.customAudioElement = null;
    }
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }
}

export const soundEngine = new SoundEngine();
