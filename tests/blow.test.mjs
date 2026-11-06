import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOW, BreathMeter, TAP_ROUNDS, TapWind, calibrate, flatness, roundTarget, thresholdFor } from '../js/blow.mjs';

const frames = (meter, count, frame) => { let state; for (let i = 0; i < count; i++) state = meter.push(frame); return state; };

test('calibration ignores a single loud spike in the quiet second', () => {
  const quiet = Array(30).fill(12);
  quiet[10] = 250;
  const { floor, threshold } = calibrate(quiet);
  assert.equal(floor, 12);
  assert.equal(threshold, thresholdFor(12));
});

test('thresholds stay within sane bounds for silent and noisy rooms', () => {
  assert.equal(thresholdFor(0), BLOW.minThreshold);
  assert.equal(thresholdFor(200), BLOW.maxThreshold);
  const mid = thresholdFor(30);
  assert.ok(mid > 30 + BLOW.floorMargin - 1 && mid <= BLOW.maxThreshold);
});

test('each round asks for more breath but never more than a microphone can give', () => {
  const t = 100;
  assert.ok(roundTarget(t, 0) < roundTarget(t, 1));
  assert.ok(roundTarget(t, 1) < roundTarget(t, 2));
  assert.equal(roundTarget(170, 2), BLOW.maxTarget);
  assert.ok(BLOW.maxTarget < 255);
});

test('a sustained blow at the target blows the candles out', () => {
  const meter = new BreathMeter({ floor: 15 });
  const state = frames(meter, 20, { level: meter.target + 5, flatness: 0.4, dt: 16, holding: true });
  assert.equal(state.done, 'breath');
  assert.ok(state.peak >= 1);
});

test('a short clap is too brief to count', () => {
  const meter = new BreathMeter({ floor: 15 });
  frames(meter, 5, { level: 250, flatness: 0.5, dt: 16, holding: true });
  const state = frames(meter, 30, { level: 16, flatness: 0.5, dt: 16, holding: true });
  assert.equal(state.done, null);
});

test('a loud, harmonic voice only counts half', () => {
  const meter = new BreathMeter({ floor: 15 });
  const target = meter.target;
  const state = frames(meter, 30, { level: target + 5, flatness: 0.02, dt: 16, holding: true });
  assert.equal(state.done, null);
  assert.ok(state.power < 0.6);
});

test('nothing counts unless Silvio holds the cake', () => {
  const meter = new BreathMeter({ floor: 15 });
  const state = frames(meter, 60, { level: 250, flatness: 0.5, dt: 16, holding: false });
  assert.equal(state.done, null);
});

test('the noise floor keeps adapting to the room between blows', () => {
  const meter = new BreathMeter({ floor: 10 });
  const before = meter.threshold;
  frames(meter, 300, { level: 30, flatness: 0.5, dt: 16, holding: false });
  assert.ok(meter.floor > 25);
  assert.ok(meter.threshold > before);
});

test('real effort that never reaches the target still wins eventually', () => {
  const meter = new BreathMeter({ floor: 15 });
  meter.setRound(2);
  const halfway = meter.floor + (meter.target - meter.floor) * 0.6;
  const state = frames(meter, Math.ceil(BLOW.failsafeMs / 16) + 2, { level: halfway, flatness: 0.4, dt: 16, holding: true });
  assert.equal(state.done, 'failsafe');
});

// Taps at a steady pace until the round ends; returns how many taps it took and why it ended.
function tapAt(round, perSecond) {
  const wind = new TapWind();
  wind.setRound(round);
  const gap = 1000 / perSecond;
  let taps = 0;
  let next = 0;
  for (let ms = 0; ms < 20000; ms += 10) {
    const tap = ms >= next ? 1 : 0;
    if (tap) { taps++; next += gap; }
    const state = wind.push({ dt: 10, taps: tap });
    if (state.done) return { taps, ms, done: state.done };
  }
  return { taps, done: null };
}

test('tap mode: every round asks for more taps at a faster pace', () => {
  for (let i = 1; i < TAP_ROUNDS.length; i++) {
    assert.ok(TAP_ROUNDS[i].taps > TAP_ROUNDS[i - 1].taps);
    assert.ok(TAP_ROUNDS[i].pace > TAP_ROUNDS[i - 1].pace);
  }
  const counts = [0, 1, 2].map(round => tapAt(round, 7));
  assert.ok(counts.every(c => c.done === 'taps'));
  assert.ok(counts[0].taps < counts[1].taps && counts[1].taps < counts[2].taps);
});

test('tap mode: a pace that wins round 1 is too slow for the last round', () => {
  assert.equal(tapAt(0, 3).done, 'taps');
  assert.equal(tapAt(2, 3).done, 'failsafe');
});

test('tap mode: a quick tapper finishes every round before the failsafe', () => {
  for (const round of [0, 1, 2]) assert.ok(tapAt(round, 7).ms < BLOW.failsafeMs);
});

test('tap mode: the wind dies down when the tapping stops', () => {
  const wind = new TapWind();
  wind.push({ dt: 10, taps: 5 });
  const before = wind.power;
  frames(wind, 100, { dt: 10, taps: 0 });
  assert.ok(wind.power < before);
  assert.equal(wind.done, null);
  assert.equal(wind.effort < 1000, true);
});

test('spectral flatness tells noise from a harmonic stack', () => {
  const noise = Array(64).fill(-40);
  const voice = Array.from({ length: 64 }, (_, i) => (i % 8 === 0 ? -20 : -90));
  assert.ok(flatness(noise) > 0.95);
  assert.ok(flatness(voice) < BLOW.tonalFlatness);
});
