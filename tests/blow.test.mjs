import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOW, BreathMeter, FingerWind, calibrate, flatness, roundTarget, thresholdFor } from '../js/blow.mjs';

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

test('finger mode: holding fills the meter, later rounds take longer', () => {
  const time = round => {
    const wind = new FingerWind();
    wind.setRound(round);
    let ms = 0;
    while (!wind.push({ dt: 16, holding: true }).done) ms += 16;
    return ms;
  };
  assert.ok(time(0) < time(1));
  assert.ok(time(1) < time(2));
  assert.ok(time(2) < BLOW.failsafeMs);
});

test('finger mode: swiping across the flames adds gusts', () => {
  const wind = new FingerWind();
  const state = frames(wind, 40, { dt: 16, holding: false, swipe: 0.08 });
  assert.equal(state.done, 'breath');
});

test('spectral flatness tells noise from a harmonic stack', () => {
  const noise = Array(64).fill(-40);
  const voice = Array.from({ length: 64 }, (_, i) => (i % 8 === 0 ? -20 : -90));
  assert.ok(flatness(noise) > 0.95);
  assert.ok(flatness(voice) < BLOW.tonalFlatness);
});
