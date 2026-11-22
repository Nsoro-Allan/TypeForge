import type { SoundMode } from "../types";

/**
 * Everything is synthesised with WebAudio, so there are no audio assets to ship
 * and the desktop bundle stays tiny.
 */
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, o: { type?: OscillatorType; f0: number; f1?: number; dur: number; gain: number; delay?: number }) {
  const t = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + o.dur);
  g.gain.setValueAtTime(o.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

function burst(c: AudioContext, o: { type: BiquadFilterType; freq: number; dur: number; gain: number; delay?: number; q?: number }) {
  if (!noise) return;
  const t = c.currentTime + (o.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = c.createBiquadFilter();
  f.type = o.type;
  f.frequency.value = o.freq;
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(o.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t, Math.random() * 0.5, o.dur + 0.05);
}

// --- typing test key sounds ----------------------------------------------------------

export function playKey(mode: SoundMode, volume: number, kind: "key" | "error"): void {
  if (mode === "off" || volume <= 0) return;
  const c = ac();
  if (!c) return;
  const v = volume;
  if (kind === "error") {
    tone(c, { type: "square", f0: 160, f1: 90, dur: 0.09, gain: 0.07 * v });
    return;
  }
  if (mode === "click") {
    burst(c, { type: "highpass", freq: 2200 + Math.random() * 800, dur: 0.03, gain: 0.35 * v });
    tone(c, { type: "square", f0: 1800, f1: 900, dur: 0.02, gain: 0.04 * v });
  } else if (mode === "thock") {
    burst(c, { type: "lowpass", freq: 900, dur: 0.05, gain: 0.5 * v });
    tone(c, { f0: 150 + Math.random() * 20, f1: 60, dur: 0.07, gain: 0.35 * v });
  } else {
    tone(c, { f0: 620 + Math.random() * 60, f1: 300, dur: 0.05, gain: 0.2 * v });
  }
}

// --- arcade sound effects -------------------------------------------------------------

export type Sfx =
  | "laser"
  | "hit"
  | "explode"
  | "boom"
  | "miss"
  | "damage"
  | "wave"
  | "clear"
  | "shock"
  | "over"
  | "ready";

export function playSfx(kind: Sfx, volume: number, param = 0): void {
  if (volume <= 0) return;
  const c = ac();
  if (!c) return;
  const v = volume;
  switch (kind) {
    case "laser": {
      const f = 760 + Math.min(param, 40) * 14;
      tone(c, { type: "sawtooth", f0: f, f1: f * 0.3, dur: 0.11, gain: 0.07 * v });
      break;
    }
    case "hit":
      burst(c, { type: "bandpass", freq: 1800, dur: 0.05, gain: 0.18 * v, q: 3 });
      break;
    case "explode":
      burst(c, { type: "lowpass", freq: 1400, dur: 0.35, gain: 0.5 * v });
      tone(c, { f0: 180, f1: 40, dur: 0.3, gain: 0.25 * v });
      break;
    case "boom":
      burst(c, { type: "lowpass", freq: 700, dur: 0.9, gain: 0.8 * v });
      tone(c, { f0: 110, f1: 28, dur: 0.8, gain: 0.45 * v });
      break;
    case "miss":
      tone(c, { type: "square", f0: 140, f1: 80, dur: 0.12, gain: 0.07 * v });
      break;
    case "damage":
      burst(c, { type: "lowpass", freq: 500, dur: 0.4, gain: 0.7 * v });
      tone(c, { type: "sawtooth", f0: 90, f1: 35, dur: 0.35, gain: 0.3 * v });
      break;
    case "wave":
      [0, 1, 2].forEach((i) => tone(c, { type: "triangle", f0: 330 * 2 ** (i * 0.5), dur: 0.18, gain: 0.12 * v, delay: i * 0.09 }));
      break;
    case "clear":
      [0, 4, 7, 12].forEach((s, i) => tone(c, { type: "triangle", f0: 440 * 2 ** (s / 12), dur: 0.22, gain: 0.12 * v, delay: i * 0.08 }));
      break;
    case "shock":
      tone(c, { type: "sawtooth", f0: 90, f1: 900, dur: 0.5, gain: 0.18 * v });
      burst(c, { type: "lowpass", freq: 1000, dur: 0.6, gain: 0.6 * v });
      break;
    case "ready":
      tone(c, { type: "sine", f0: 880, dur: 0.12, gain: 0.12 * v });
      tone(c, { type: "sine", f0: 1320, dur: 0.18, gain: 0.12 * v, delay: 0.1 });
      break;
    case "over":
      [0, -3, -7, -12].forEach((s, i) => tone(c, { type: "triangle", f0: 440 * 2 ** (s / 12), dur: 0.35, gain: 0.14 * v, delay: i * 0.18 }));
      break;
  }
}
