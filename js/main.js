import { copy } from './copy.mjs';
import { Director } from './director.mjs';
import { Mic } from './mic.mjs';
import { TheatreSound } from './sound.mjs';

const $ = id => document.getElementById(id);
const body = document.body;

// Static text comes from copy.mjs too; the HTML keeps the same words as a no-JS fallback.
const lookup = path => path.split('.').reduce((value, key) => value?.[key], copy);
document.querySelectorAll('[data-copy]').forEach(el => {
  const text = lookup(el.dataset.copy);
  if (typeof text === 'string') el.textContent = text;
});
$('work-order-rows').replaceChildren(...copy.workOrder.rows.flatMap(([term, detail]) => {
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = term;
  dd.textContent = detail;
  return [dt, dd];
}));
$('high-scores').replaceChildren(...copy.workOrder.highScores.map(([name, label, score], index) => {
  const row = document.createElement('tr');
  for (const text of [`${index + 1}.`, name, label, score ?? '']) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.append(cell);
  }
  if (score === null) row.lastChild.id = 'high-score';
  return row;
}));

const sound = new TheatreSound();
const mic = new Mic();
const params = new URLSearchParams(location.search);
const director = new Director({ sound, mic, copy, debug: params.get('debug') === 'mic', speed: Number(params.get('speed')) || 1 });

const soundButton = $('sound-button');
const withSound = $('start-with-sound');
const quietly = $('start-quietly');
let started = false;

document.documentElement.classList.add('js');

function showSound(on) {
  soundButton.setAttribute('aria-pressed', String(on));
  soundButton.querySelector('.label').textContent = on ? 'Sound on' : 'Sound off';
}

async function start(enabled) {
  if (started) return;
  started = true;
  withSound.disabled = quietly.disabled = true;
  showSound(await sound.setEnabled(enabled));
  sound.cue('start');
  $('boot').inert = true;
  body.classList.add('started');
  director.play();
}

withSound.addEventListener('click', () => start(true));
quietly.addEventListener('click', () => start(false));

soundButton.addEventListener('click', async () => {
  soundButton.disabled = true;
  try {
    showSound(await sound.toggle());
    sound.cue('select');
  } finally { soundButton.disabled = false; }
});

$('skip-button').addEventListener('click', () => director.skip());
$('replay-button').addEventListener('click', () => {
  $('lamp-button').setAttribute('aria-pressed', 'false');
  director.play();
});
$('lamp-button').addEventListener('click', event => director.lamp(event.currentTarget));

document.addEventListener('visibilitychange', () => {
  body.classList.toggle('paused', document.hidden);
  if (document.hidden) sound.pause();
  else sound.resume();
});
if (params.has('debug')) window.director = director;
