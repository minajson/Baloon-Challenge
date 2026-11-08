/**
 * Sound manager: sound effects (prefers /media/sfx/*.wav, falls back to Web
 * Audio synthesis) plus a single persistent background-music player with
 * smooth ducking while the mascot speaks. Everything runs offline.
 *
 * Audio priority: mascot voice > correct/incorrect feedback > balloon pop >
 * background music (which ducks whenever the mascot is speaking).
 */

export type SfxName =
  | "pop"
  | "correct"
  | "wrong"
  | "tick"
  | "fanfare"
  | "click";

const SFX_FILES: Record<SfxName, string> = {
  pop: "/media/sfx/pop.wav",
  correct: "/media/sfx/correct.wav",
  wrong: "/media/sfx/wrong.wav",
  tick: "/media/sfx/tick.wav",
  fanfare: "/media/sfx/fanfare.wav",
  click: "/media/sfx/click.wav",
};

// The generated .wav loop. To use a licensed track instead, add its path
// BEFORE the .wav here and ship the file (a missing file would be a 404).
const MUSIC_FILES = ["/media/audio/background-music.wav"];

class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<SfxName, AudioBuffer>();
  private missing = new Set<SfxName>();
  enabled = true;

  // Background music (HTMLAudioElement so it can loop a real file seamlessly).
  private music: HTMLAudioElement | null = null;
  private musicEnabled = false;
  private baseMusicVolume = 0.12;
  private ducked = false;
  private fadeTimer: number | null = null;

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Warm the context and file buffers after the first user interaction. */
  preload(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    (Object.keys(SFX_FILES) as SfxName[]).forEach((name) => {
      void this.loadBuffer(name);
    });
  }

  private async loadBuffer(name: SfxName): Promise<AudioBuffer | null> {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    if (this.buffers.has(name)) return this.buffers.get(name)!;
    if (this.missing.has(name)) return null;
    try {
      const res = await fetch(SFX_FILES[name]);
      if (!res.ok) throw new Error("missing");
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      this.buffers.set(name, buf);
      return buf;
    } catch {
      this.missing.add(name);
      return null;
    }
  }

  async play(name: SfxName): Promise<void> {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const buf = await this.loadBuffer(name);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = name === "tick" ? 0.35 : 0.8;
      src.connect(gain).connect(ctx.destination);
      src.start();
      return;
    }
    this.synth(name, ctx);
  }

  // ---- Background music -------------------------------------------------

  configureMusic(enabled: boolean, volume: number): void {
    this.musicEnabled = enabled;
    this.baseMusicVolume = volume;
    if (!enabled) {
      this.stopMusic();
    } else if (this.music) {
      this.music.volume = this.targetVolume();
    }
  }

  /** Start (or resume) the looping background track. Call after a user click. */
  startMusic(): void {
    if (!this.musicEnabled || typeof window === "undefined") return;
    if (!this.music) {
      const el = new Audio();
      el.loop = true;
      el.preload = "auto";
      el.volume = this.targetVolume();
      // Try each source in order; on error advance to the next candidate.
      let sourceIndex = 0;
      el.src = MUSIC_FILES[sourceIndex];
      el.addEventListener("error", () => {
        sourceIndex += 1;
        if (sourceIndex < MUSIC_FILES.length) {
          el.src = MUSIC_FILES[sourceIndex];
          if (this.musicEnabled) void el.play().catch(() => {});
        } else {
          this.music = null; // No track available — stay silent, never crash.
        }
      });
      this.music = el;
    }
    this.music.volume = this.targetVolume();
    void this.music.play().catch(() => {
      /* Autoplay blocked until a user gesture — retried on next call. */
    });
  }

  stopMusic(): void {
    if (this.music) {
      this.music.pause();
    }
  }

  private targetVolume(): number {
    return this.ducked ? this.baseMusicVolume * 0.3 : this.baseMusicVolume;
  }

  /** Smoothly lower the music while the mascot speaks. */
  duck(): void {
    this.ducked = true;
    this.fadeMusicTo(this.targetVolume());
  }

  /** Restore music volume after the mascot finishes. */
  unduck(): void {
    this.ducked = false;
    this.fadeMusicTo(this.targetVolume());
  }

  private fadeMusicTo(target: number): void {
    const el = this.music;
    if (!el) return;
    if (this.fadeTimer) window.clearInterval(this.fadeTimer);
    const steps = 12;
    const start = el.volume;
    const delta = (target - start) / steps;
    let i = 0;
    this.fadeTimer = window.setInterval(() => {
      i += 1;
      el.volume = Math.max(0, Math.min(1, start + delta * i));
      if (i >= steps) {
        if (this.fadeTimer) window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, 40);
  }

  // ---- Web Audio fallback synthesis ------------------------------------

  private synth(name: SfxName, ctx: AudioContext): void {
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.connect(ctx.destination);
    const tone = (
      freq: number,
      start: number,
      dur: number,
      type: OscillatorType = "sine",
      vol = 0.5,
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t + start);
      g.gain.setValueAtTime(0, t + start);
      g.gain.linearRampToValueAtTime(vol, t + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.connect(g).connect(out);
      osc.start(t + start);
      osc.stop(t + start + dur + 0.05);
    };
    switch (name) {
      case "pop": {
        const len = Math.floor(ctx.sampleRate * 0.12);
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++)
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const g = ctx.createGain();
        g.gain.value = 0.7;
        src.connect(g).connect(out);
        src.start(t);
        tone(180, 0, 0.09, "triangle", 0.5);
        break;
      }
      case "correct":
        tone(523.25, 0, 0.15, "triangle", 0.45);
        tone(659.25, 0.1, 0.15, "triangle", 0.45);
        tone(783.99, 0.2, 0.3, "triangle", 0.5);
        break;
      case "wrong":
        tone(392, 0, 0.22, "sine", 0.35);
        tone(311.13, 0.18, 0.35, "sine", 0.3);
        break;
      case "tick":
        tone(880, 0, 0.07, "sine", 0.25);
        break;
      case "fanfare":
        tone(523.25, 0, 0.18, "triangle", 0.4);
        tone(659.25, 0.14, 0.18, "triangle", 0.4);
        tone(783.99, 0.28, 0.18, "triangle", 0.4);
        tone(1046.5, 0.42, 0.5, "triangle", 0.5);
        break;
      case "click":
        tone(600, 0, 0.05, "square", 0.12);
        break;
    }
  }
}

export const sound = new SoundManager();
