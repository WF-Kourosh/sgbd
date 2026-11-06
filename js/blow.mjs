// Candle-blowing math, kept free of browser APIs so it can be unit tested.
//
// Levels are the mean of the analyser's byte spectrum below ~1.5 kHz (0–255), where breath on a
// microphone puts most of its energy. Flatness (0–1) is measured over 250 Hz–4 kHz: blowing is
// turbulent noise (flat), a voice is a stack of harmonics (peaky). Claps and pops are too short to
// pass the sustain gate.

export const BLOW = {
  calibrationMs: 1000,
  minThreshold: 45,
  maxThreshold: 170,
  floorMultiplier: 2.4,
  floorMargin: 32,
  roundScale: [1, 1.2, 1.4],
  maxTarget: 215,
  sustainMs: 260,
  failsafeMs: 8000,
  effortFloor: 0.35,
  tonalFlatness: 0.08,
  floorAdapt: 0.02,
};

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function thresholdFor(floor, b = BLOW) {
  const raw = Math.max(floor * b.floorMultiplier, floor + b.floorMargin);
  return Math.min(b.maxThreshold, Math.max(b.minThreshold, raw));
}

// The median ignores a cough or a door slam during the quiet second.
export function calibrate(levels, b = BLOW) {
  const floor = median(levels);
  return { floor, threshold: thresholdFor(floor, b) };
}

export function roundTarget(threshold, round, b = BLOW) {
  const scale = b.roundScale[Math.min(round, b.roundScale.length - 1)];
  return Math.min(b.maxTarget, threshold * scale);
}

// Feed one analyser frame at a time. Power is 1 when the breath reaches this round's target.
export class BreathMeter {
  constructor({ floor = 0, b = BLOW } = {}) {
    this.b = b;
    this.floor = floor;
    this.setRound(0);
  }

  get threshold() { return thresholdFor(this.floor, this.b); }
  get target() { return roundTarget(this.threshold, this.round, this.b); }

  setRound(round) {
    this.round = round;
    this.sustain = 0;
    this.effort = 0;
    this.power = 0;
    this.peak = 0;
    this.done = null;
  }

  push({ level, flatness = 1, dt, holding = true }) {
    if (this.done) return this.state();
    const b = this.b;
    if (!holding) {
      // Keep learning the room while nobody is blowing, so a TV switching on doesn't break it.
      // Capping the sample stops one shout between rounds from making the next round impossible.
      this.floor += (Math.min(level, this.threshold) - this.floor) * b.floorAdapt;
      this.sustain = 0;
      this.power = Math.max(0, this.power - dt / 400);
      return this.state();
    }
    const tonal = flatness < b.tonalFlatness;
    const effective = tonal ? this.floor + (level - this.floor) * 0.5 : level;
    const span = Math.max(1, this.target - this.floor);
    this.power = Math.min(1.3, Math.max(0, (effective - this.floor) / span));
    this.peak = Math.max(this.peak, this.power);
    this.sustain = this.power >= 1 ? this.sustain + dt : 0;
    if (this.power >= b.effortFloor) this.effort += dt;
    if (this.sustain >= b.sustainMs) this.done = 'breath';
    else if (this.effort >= b.failsafeMs) this.done = 'failsafe';
    return this.state();
  }

  state() {
    return { power: this.power, peak: this.peak, done: this.done, effort: this.effort };
  }
}

// Fallback when there's no microphone: tap to blow. Every tap is a gust, and the wind dies
// down between taps. Each round needs more taps at a faster pace: below `pace` taps
// per second the meter only drains.
export const TAP_ROUNDS = [
  { taps: 8, pace: 1 },
  { taps: 12, pace: 1.8 },
  { taps: 16, pace: 2.5 },
];

export class TapWind {
  constructor({ b = BLOW, rounds = TAP_ROUNDS } = {}) {
    this.b = b;
    this.rounds = rounds;
    this.setRound(0);
  }

  setRound(round) {
    this.round = round;
    this.cfg = this.rounds[Math.min(round, this.rounds.length - 1)];
    this.power = 0;
    this.peak = 0;
    this.effort = 0;
    this.sinceTap = Infinity;
    this.done = null;
  }

  push({ dt, taps = 0 }) {
    if (this.done) return this.state();
    const gust = 1 / this.cfg.taps;
    const leak = this.cfg.pace * gust * dt / 1000;
    this.power = Math.min(1.3, Math.max(0, this.power + taps * gust - leak));
    this.peak = Math.max(this.peak, this.power);
    this.sinceTap = taps ? 0 : this.sinceTap + dt;
    // Only time spent actually tapping counts towards the failsafe.
    if (this.sinceTap < 600) this.effort += dt;
    if (this.power >= 1) this.done = 'taps';
    else if (this.effort >= this.b.failsafeMs) this.done = 'failsafe';
    return this.state();
  }

  state() {
    return { power: this.power, peak: this.peak, done: this.done, effort: this.effort };
  }
}

// Spectral flatness: geometric mean over arithmetic mean of linear magnitudes from dB bins.
export function flatness(dbBins, from = 0, to = dbBins.length) {
  let logSum = 0;
  let sum = 0;
  let n = 0;
  for (let i = from; i < to; i++) {
    const db = dbBins[i];
    if (!Number.isFinite(db)) continue;
    const mag = 10 ** (db / 20);
    logSum += Math.log(mag + 1e-12);
    sum += mag;
    n++;
  }
  if (!n || sum <= 0) return 0;
  return Math.exp(logSum / n) / (sum / n);
}

export function meanLevel(byteBins, from = 0, to = byteBins.length) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += byteBins[i];
  return to > from ? sum / (to - from) : 0;
}

export function binFor(hz, sampleRate, fftSize) {
  return Math.round(hz / (sampleRate / fftSize));
}
