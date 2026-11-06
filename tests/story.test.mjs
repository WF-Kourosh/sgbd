import test from 'node:test';
import assert from 'node:assert/strict';
import { copy } from '../js/copy.mjs';
import { story } from '../js/story.mjs';

// A director that records what the screenplay asks for and answers instantly.
function fakeDirector({ mic = true, choice = 'mic', blowReason = 'breath', coin = true } = {}) {
  const log = [];
  const record = name => (...args) => { log.push([name, ...args]); };
  return {
    log,
    names: () => log.map(([name, arg]) => (typeof arg === 'string' ? `${name}:${arg}` : name)),
    said: () => log.filter(([name]) => name === 'say' || name === 'show').map(([, line]) => line.text),
    scene: record('scene'), flag: record('flag'), candles: record('candles'), cue: record('cue'),
    banner: record('banner'), announce: record('announce'), score: record('score'), lives: record('lives'),
    countdown: record('countdown'), stopMic: record('stopMic'), quiet: record('quiet'), finish: record('finish'),
    show: record('show'),
    async wait(ms) { log.push(['wait', ms]); },
    async say(line, options) { log.push(['say', line]); return options?.choices ? (options.choices.find(c => c.id === choice) ?? options.choices[0]).id : undefined; },
    async upload(from, to) { log.push(['upload', from, to]); },
    async startMic() { log.push(['startMic']); return mic; },
    async calibrate() { log.push(['calibrate']); },
    async blow(round, mode) { log.push(['blow', round, mode]); return { reason: blowReason, peak: 1.1 }; },
    async coin() { log.push(['coin']); return coin; },
  };
}

const index = (d, entry) => d.names().indexOf(entry);

test('the story runs from the cake to the work order', async () => {
  const d = fakeDirector();
  await story(d, copy);
  const scenes = d.log.filter(([name]) => name === 'scene').map(([, s]) => s);
  assert.deepEqual(scenes, ['party', 'wish', 'lungs', 'round-1', 'round-2', 'round-3', 'quake', 'collapse', 'lastwords', 'gameover', 'continue', 'foreman']);
  assert.equal(d.log.at(-1)[0], 'finish');
});

test('Silvio wishes before any candle is blown, and the wish is never shown', async () => {
  const d = fakeDirector();
  await story(d, copy);
  assert.ok(index(d, 'upload') < d.names().findIndex(n => n === 'blow'));
  const text = d.said().join(' ') + d.log.filter(([n]) => n === 'banner').map(([, t]) => t).join(' ');
  assert.doesNotMatch(text, /your wish was|you wished for/i);
});

test('the candles relight twice and only go out for good on the third blow', async () => {
  const d = fakeDirector();
  await story(d, copy);
  const candles = d.log.filter(([name]) => name === 'candles').map(([, s]) => s);
  assert.deepEqual(candles, ['lit', 'out', 'lit', 'out', 'lit', 'gone']);
  const blows = d.log.filter(([name]) => name === 'blow').map(([, round]) => round);
  assert.deepEqual(blows, [0, 1, 2]);
});

test('the microphone is released before the stage comes down', async () => {
  const d = fakeDirector();
  await story(d, copy);
  assert.ok(index(d, 'stopMic') < index(d, 'scene:collapse'));
  assert.ok(index(d, 'calibrate') < d.names().indexOf('blow'));
});

test('no microphone falls back to the finger, with an excuse when it was refused', async () => {
  const refused = fakeDirector({ mic: false });
  await story(refused, copy);
  assert.ok(refused.said().includes(copy.mic.denied.text));
  assert.ok(refused.log.filter(([n]) => n === 'blow').every(([, , mode]) => mode === 'finger'));
  assert.equal(refused.names().includes('calibrate'), false);

  const chose = fakeDirector({ choice: 'finger' });
  await story(chose, copy);
  assert.equal(chose.names().includes('startMic'), false);
  assert.equal(chose.said().includes(copy.mic.denied.text), false);
});

test('the failsafe gets its own generous line', async () => {
  const d = fakeDirector({ blowReason: 'failsafe' });
  await story(d, copy);
  assert.equal(d.said().filter(t => t === copy.failsafe.text).length, 3);
  const normal = fakeDirector();
  await story(normal, copy);
  assert.equal(normal.said().includes(copy.failsafe.text), false);
});

test('Jesus dies mid-sentence, before the present is ever named', async () => {
  const d = fakeDirector();
  await story(d, copy);
  const last = copy.lastWords.at(-1);
  assert.equal(last.cut, true);
  assert.match(last.text, /—$/);
  assert.ok(d.log.findIndex(([n, l]) => n === 'say' && l === last) < index(d, 'flag:dead'));
  for (const line of copy.lastWords) assert.doesNotMatch(`${line.text} ${line.sub ?? ''}`, /present is|the present:/i);
});

test('the continue countdown stalls at 3 and becomes 3 days', async () => {
  const d = fakeDirector();
  await story(d, copy);
  const counts = d.log.filter(([name]) => name === 'countdown').map(([, t]) => t);
  assert.deepEqual(counts, ['9', '8', '7', '6', '5', '4', '3', '3 DAYS']);
});

test('the foreman only arrives after Jesus has died, and the coin is optional', async () => {
  const d = fakeDirector({ coin: false });
  await story(d, copy);
  assert.ok(index(d, 'flag:dead') < index(d, 'scene:foreman'));
  assert.ok(index(d, 'flag:buried') < index(d, 'flag:dead'));
  assert.equal(d.names().includes('cue:coin'), false);
  assert.ok(d.log.findIndex(([n, l]) => n === 'say' && l?.who === 'VORARBEITER') > index(d, 'scene:foreman'));
});
