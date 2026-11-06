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
const cells = (tag, texts) => texts.map(text => {
  const cell = document.createElement(tag);
  cell.textContent = text;
  return cell;
});
const header = document.createElement('tr');
header.append(...cells('th', copy.workOrder.scoreColumns));
$('high-scores-head').replaceChildren(header);
const rank = n => `${n}${['ST', 'ND', 'RD'][n - 1] ?? 'TH'}`;
$('high-scores').replaceChildren(...copy.workOrder.highScores.map(({ name, feat, score }, index) => {
  const row = document.createElement('tr');
  row.append(...cells('td', [rank(index + 1), name, feat, String(score ?? 0).padStart(6, '0')]));
  // Silvio's row is filled in at the end, with the points he actually scored.
  if (score === null) {
    row.className = 'you';
    row.lastChild.id = 'high-score';
  }
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

$('replay-button').addEventListener('click', () => director.play());
$('fiat-button').addEventListener('click', () => director.fiatLux());

document.addEventListener('visibilitychange', () => {
  body.classList.toggle('paused', document.hidden);
  if (document.hidden) sound.pause();
  else sound.resume();
});
if (params.has('debug')) window.director = director;
