/**
 * Games254 procedural audio — every sound is synthesized with the Web Audio API.
 * No external URLs, no audio files. A lazily-created shared AudioContext powers
 * one-shot effects, an ambient night-city loop, and a ducked heartbeat mode for
 * tournament countdown finales.
 */

type Ctor = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let duckFilter: BiquadFilterNode | null = null;
let duckGain: GainNode | null = null;
let ambientNodes: { stop: () => void } | null = null;
let heartbeatNodes: { stop: () => void } | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) {
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.5;
    duckGain = ctx.createGain();
    duckGain.gain.value = 1;
    duckFilter = ctx.createBiquadFilter();
    duckFilter.type = 'lowpass';
    duckFilter.frequency.value = 18_000;
    // Effect bus routes through duckGain -> duckFilter -> master.
    duckGain.connect(duckFilter);
    duckFilter.connect(master);
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setAudioEnabled(next: boolean) {
  enabled = next;
  if (!next) stopAmbient();
  if (master && ctx) master.gain.setTargetAtTime(next ? 0.5 : 0, ctx.currentTime, 0.05);
}

export function audioEnabled() {
  return enabled;
}

function bus(): { ctx: AudioContext; out: AudioNode } | null {
  const context = ac();
  if (!context || !duckGain || !enabled) return null;
  return { ctx: context, out: duckGain };
}

type ToneOpts = {
  freq: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  at?: number; // start offset in seconds from now
  slideTo?: number; // exponential glide target frequency
  attack?: number;
};

function tone({ freq, type = 'sine', dur = 0.15, gain = 0.08, at = 0, slideTo, attack = 0.008 }: ToneOpts) {
  const b = bus();
  if (!b) return;
  const { ctx: context, out } = b;
  const osc = context.createOscillator();
  const env = context.createGain();
  const t0 = context.currentTime + at;
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env);
  env.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur: number, gain: number, freq: number, q = 1) {
  const b = bus();
  if (!b) return;
  const { ctx: context, out } = b;
  const frames = Math.max(1, Math.floor(context.sampleRate * dur));
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = context.createBufferSource();
  src.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = context.createGain();
  const t0 = context.currentTime;
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(env);
  env.connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// ---------------------------------------------------------------------------
// Public effects
// ---------------------------------------------------------------------------

/** Satisfying wood-snap for selecting / placing a piece. */
export function playClick() {
  noiseBurst(0.045, 0.16, 1900, 2.2);
  tone({ freq: 210, type: 'triangle', dur: 0.06, gain: 0.1, slideTo: 130 });
}

/** Double-tone climbing frequency for successful token jumps. */
export function playJump(hops = 1) {
  const base = 340;
  tone({ freq: base, type: 'sine', dur: 0.09, gain: 0.09 });
  tone({ freq: base * 1.5, type: 'sine', dur: 0.12, gain: 0.1, at: 0.07 });
  if (hops > 1) tone({ freq: base * 2.25, type: 'sine', dur: 0.14, gain: 0.11, at: 0.15 });
  noiseBurst(0.05, 0.06, 2600, 3);
}

/** Quick low-frequency laser zap for invalid moves and errors. */
export function playZap() {
  tone({ freq: 220, type: 'sawtooth', dur: 0.16, gain: 0.09, slideTo: 55 });
  tone({ freq: 180, type: 'square', dur: 0.1, gain: 0.04, slideTo: 60, at: 0.02 });
}

/** Rich tape-rewind synth effect for the undo utility. */
export function playRewind() {
  tone({ freq: 1600, type: 'sawtooth', dur: 0.42, gain: 0.05, slideTo: 220 });
  tone({ freq: 1585, type: 'sawtooth', dur: 0.42, gain: 0.045, slideTo: 214 }); // slow-beat wobble
  noiseBurst(0.4, 0.03, 1200, 0.7);
}

/** King crown moment — ascending brass-ish arpeggio plus shimmer. */
export function playKing() {
  [523, 659, 784, 1047].forEach((freq, i) => tone({ freq, type: 'triangle', dur: 0.22, gain: 0.1, at: i * 0.07 }));
  tone({ freq: 2093, type: 'sine', dur: 0.5, gain: 0.035, at: 0.28 });
  noiseBurst(0.35, 0.045, 5200, 1.4);
}

/** Match win chord. */
export function playWin() {
  [392, 494, 587, 784].forEach((freq, i) => tone({ freq, type: 'sine', dur: 0.4, gain: 0.09, at: i * 0.06 }));
}

/** Match loss — descending minor. */
export function playLose() {
  [330, 294, 247, 196].forEach((freq, i) => tone({ freq, type: 'sine', dur: 0.34, gain: 0.08, at: i * 0.1 }));
}

/** Ascending octave scale for consecutive win streaks — one rung per streak. */
export function playStreak(streak: number) {
  const steps = Math.max(1, Math.min(8, streak));
  const major = [262, 294, 330, 349, 392, 440, 494, 523];
  for (let i = 0; i < steps; i++) {
    tone({ freq: major[i], type: 'triangle', dur: 0.12, gain: 0.085, at: i * 0.06 });
  }
  tone({ freq: major[Math.min(7, steps - 1)] * 2, type: 'sine', dur: 0.3, gain: 0.07, at: steps * 0.06 + 0.02 });
}

/** Fortune wheel tick per segment passed. */
export function playTick() {
  noiseBurst(0.02, 0.07, 3400, 4);
  tone({ freq: 900, type: 'square', dur: 0.03, gain: 0.03 });
}

/** Confetti / celebration pop. */
export function playPop() {
  noiseBurst(0.08, 0.12, 1500, 1.2);
  tone({ freq: 660, type: 'sine', dur: 0.09, gain: 0.06, slideTo: 1320 });
}

/** Money confirmed — M-Pesa style. */
export function playCash() {
  tone({ freq: 784, type: 'sine', dur: 0.16, gain: 0.09 });
  tone({ freq: 1047, type: 'sine', dur: 0.28, gain: 0.09, at: 0.12 });
}

/** Countdown beep for the final 10 seconds. */
export function playCountdown(urgent = false) {
  tone({ freq: urgent ? 880 : 440, type: 'square', dur: urgent ? 0.1 : 0.07, gain: urgent ? 0.07 : 0.05 });
}

// ---------------------------------------------------------------------------
// Ambient loop + ducked heartbeat mode
// ---------------------------------------------------------------------------

/** Low night-city ambient pad: two detuned saws through a slow LFO. */
export function startAmbient() {
  const b = bus();
  if (!b || ambientNodes) return;
  const { ctx: context, out } = b;
  const env = context.createGain();
  env.gain.value = 0;
  env.gain.setTargetAtTime(0.028, context.currentTime, 2.5);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.6;
  const oscA = context.createOscillator();
  oscA.type = 'sawtooth';
  oscA.frequency.value = 55; // A1
  const oscB = context.createOscillator();
  oscB.type = 'sawtooth';
  oscB.frequency.value = 55.7; // slow beat
  const lfo = context.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = context.createGain();
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(env);
  env.connect(out);
  [oscA, oscB, lfo].forEach((osc) => osc.start());
  ambientNodes = {
    stop: () => {
      env.gain.setTargetAtTime(0, context.currentTime, 0.4);
      window.setTimeout(() => [oscA, oscB, lfo].forEach((osc) => osc.stop()), 1600);
    },
  };
}

export function stopAmbient() {
  ambientNodes?.stop();
  ambientNodes = null;
}

/**
 * Shifts the ambience into a heavy bass-driven heartbeat pulse.
 * Call with `true` during the final 10 seconds of a tournament clock,
 * and `false` to restore the normal ambient bed.
 */
export function setHeartbeatMode(active: boolean) {
  const context = ac();
  if (!context) return;
  if (duckFilter && duckGain) {
    duckFilter.frequency.setTargetAtTime(active ? 140 : 18_000, context.currentTime, 0.25);
    duckGain.gain.setTargetAtTime(active ? 0.75 : 1, context.currentTime, 0.25);
  }
  if (active) {
    if (heartbeatNodes || !duckGain) return;
    const env = context.createGain();
    env.gain.value = 0;
    env.gain.setTargetAtTime(0.5, context.currentTime, 0.2);
    env.connect(duckGain);
    const thump = (at: number, gain: number) => {
      const osc = context.createOscillator();
      const g = context.createGain();
      const t0 = context.currentTime + at;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(82, t0);
      osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.18);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      osc.connect(g);
      g.connect(env);
      osc.start(t0);
      osc.stop(t0 + 0.3);
    };
    let beat = 0;
    const interval = window.setInterval(() => {
      thump(0, 0.5);
      thump(0.26, 0.3); // lub-dub
      beat++;
    }, 900);
    thump(0.05, 0.5);
    heartbeatNodes = {
      stop: () => {
        window.clearInterval(interval);
        window.clearInterval(beat);
        env.gain.setTargetAtTime(0, context.currentTime, 0.2);
        window.setTimeout(() => env.disconnect(), 1200);
      },
    };
  } else {
    heartbeatNodes?.stop();
    heartbeatNodes = null;
  }
}
