/**
 * AudioSynth - Standalone Procedural Sound Synthesizer
 * Uses Web Audio API to generate dynamic acoustic feedback for 3D interactions.
 * Fully decoupled from React lifecycle.
 */
export type SoundEffectType = 'boing' | 'collect' | 'boost' | 'spin' | 'hit' | 'defeat' | 'fanfare';

export class AudioSynth {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.isEnabled = enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  private getContext(): AudioContext | null {
    if (!this.isEnabled) return null;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioContextClass();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public play(type: SoundEffectType): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (type === 'boing') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (type === 'collect') {
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord arpeggio
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.045;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);
          gain.gain.setValueAtTime(0.14, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.26);
        });
      } else if (type === 'boost') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.37);
      } else if (type === 'spin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.linearRampToValueAtTime(840, now + 0.15);
        osc.frequency.linearRampToValueAtTime(420, now + 0.30);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.33);
      } else if (type === 'hit') {
        // Punchy cartoon hit thump with pitch drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (type === 'defeat') {
        // Cheerful cartoon pop & defeated squish
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (type === 'fanfare') {
        // Triumphal victory brass fanfare arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.08;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);
          gain.gain.setValueAtTime(0.22, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.46);
        });
      }
    } catch {
      // Audio autoplay policy or hardware suspended - non-blocking
    }
  }

  public dispose(): void {
    if (this.ctx) {
      try {
        this.ctx.close().catch(() => {});
      } catch {}
      this.ctx = null;
    }
  }
}
