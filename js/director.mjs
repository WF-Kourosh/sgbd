// Runs the screenplay on the page: one animation-frame clock (so a hidden tab pauses everything),
// a typewriter dialogue box, and the inputs Silvio uses to wish, blow and insert coins.
import { BLOW, BreathMeter, TapWind, calibrate } from './blow.mjs';
import { story } from './story.mjs';

export class Cancelled extends Error {}

const $ = id => document.getElementById(id);
// Android buzzes along with the big moments. Phones that can't vibrate ignore it.
const BUZZ = {
  select: 10, coin: 30, whoosh: 40, stall: 60, nein: [30, 50, 30], hammer: [20, 60, 20, 60, 20],
  shake: [80, 60, 80, 60, 80], crack: [60, 40, 120], crash: 200, impact: 400,
};
const FLAGS = ['eyes-closed', 'wind-1', 'wind-2', 'wind-3', 'buried', 'dead', 'installing', 'stalled', 'coined', 'lights-out', 'lux', 'ufo-pass', 'winking', 'talking', 'blowing', 'holding', 'straining', 'nudge', 'typing', 'finished'];

export class Director {
  constructor({ sound, mic, copy, debug = false, speed = 1 }) {
    this.sound = sound;
    this.mic = mic;
    this.copy = copy;
    this.debug = debug;
    this.speed = speed;
    this.body = document.body;
    this.el = {
      score: $('hud-score'), lives: $('hud-lives'), dialogue: $('dialogue'), speaker: $('speaker'),
      line: $('line'), sub: $('subline'), choices: $('choices'), hold: $('hold-button'), holdLabel: $('hold-label'),
      meter: $('meter'), meterLabel: $('meter-label'), meterFill: $('meter-fill'), meterTarget: $('meter-target'), flash: $('flash'),
      upload: $('upload-label'), uploadFill: $('upload-fill'), countdown: $('countdown'),
      coin: $('coin-button'), coinNote: $('coin-note'), progress: $('progress-button'),
      progressValue: $('progress-value'), nein: $('nein'), highScore: $('high-score'), sr: $('sr'),
      cake: $('cake'), debug: $('debug'), stage: document.querySelector('.stage'),
      halo: document.querySelector('.jesus .halo'), night: document.querySelector('.night'),
      fiat: $('fiat-button'), replay: $('replay-button'), ufo: document.querySelector('.ufo'),
    };
    this.epoch = 0;
    this.time = 0;
    this.last = null;
    this.waiters = new Set();
    this.tasks = new Set();
    this.holding = { pointer: false, key: false };
    this.taps = 0;
    this.points = 0;
    this.neinIndex = 0;
    this.breath = null;
    this.bind();
    requestAnimationFrame(now => this.frame(now));
  }

  // ---------- Playback ----------

  play() {
    this.reset();
    const epoch = this.epoch;
    // Every call from an old run throws, so a replay can't be disturbed by the previous story.
    const d = new Proxy(this, {
      get: (target, key) => {
        const value = target[key];
        if (typeof value !== 'function') return value;
        return (...args) => {
          if (target.epoch !== epoch) throw new Cancelled();
          return value.apply(target, args);
        };
      },
    });
    story(d, this.copy).catch(error => { if (!(error instanceof Cancelled)) console.error(error); });
  }

  cancel() {
    this.epoch++;
    for (const waiter of this.waiters) waiter.reject(new Cancelled());
    this.waiters.clear();
    this.tasks.clear();
  }

  reset() {
    this.cancel();
    this.stopMic();
    this.breath = null;
    this.sound.stop();
    FLAGS.forEach(f => this.body.classList.remove(f));
    this.body.dataset.mood = '';
    this.body.dataset.candles = 'lit';
    this.body.style.setProperty('--power', '0');
    this.el.dialogue.hidden = true;
    this.el.choices.replaceChildren();
    this.el.flash.textContent = '';
    this.el.coinNote.textContent = '';
    this.el.countdown.textContent = '';
    this.setUpload('', 0);
    this.typing = null;
    this.holding.pointer = this.holding.key = false;
    this.points = 0;
    this.peak = 0;
    this.score(0);
    this.lives(3);
    this.scene('party');
  }

  frame(now) {
    const dt = (this.last === null ? 16 : Math.min(100, now - this.last)) * this.speed;
    this.last = now;
    if (!document.hidden) this.step(dt);
    requestAnimationFrame(next => this.frame(next));
  }

  step(dt) {
    this.time += dt;
    for (const task of [...this.tasks]) task(dt);
    for (const waiter of [...this.waiters]) {
      if (waiter.at !== undefined && this.time >= waiter.at) { this.waiters.delete(waiter); waiter.resolve(); }
    }
  }

  // A promise that Cancelled can reject. `at` makes it resolve on the clock.
  pending(at) {
    let waiter;
    const promise = new Promise((resolve, reject) => { waiter = { at, resolve: v => { this.waiters.delete(waiter); resolve(v); }, reject }; });
    this.waiters.add(waiter);
    return { promise, waiter };
  }

  task(fn) {
    this.tasks.add(fn);
    return () => this.tasks.delete(fn);
  }

  // Runs fn once, ms from now on the story clock. A replay cancels it.
  after(ms, fn) {
    const at = this.time + ms;
    const stop = this.task(() => { if (this.time >= at) { stop(); fn(); } });
  }

  // ---------- Stage ----------

  scene(name) { this.body.dataset.scene = name; }
  flag(name, on = true) { this.body.classList.toggle(name, on); }
  candles(state) { this.body.dataset.candles = state; }
  cue(name) {
    // Our own sounds would be heard by the open microphone (echo cancellation is off).
    if (this.mic.live && name === 'blip') return;
    this.buzz(BUZZ[name]);
    this.sound.cue(name);
  }

  buzz(pattern) {
    // The open microphone would hear the phone buzzing too.
    if (!pattern || (this.mic.live && this.body.classList.contains('blowing'))) return;
    navigator.vibrate?.(pattern);
  }
  wait(ms) { return this.pending(this.time + ms).promise; }
  announce(text) { this.el.sr.textContent = text; }
  quiet() { this.el.dialogue.hidden = true; this.stopTyping(); this.body.dataset.mood = ''; }

  banner(text) {
    const flash = this.el.flash;
    flash.textContent = text;
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
    this.announce(text);
  }

  score(add) {
    this.points += add;
    this.el.score.textContent = String(Math.round(this.points)).padStart(6, '0');
  }

  lives(n) {
    this.el.lives.textContent = '♥'.repeat(n) + '♡'.repeat(3 - n);
    this.el.lives.setAttribute('aria-label', `Lives: ${n}`);
  }

  // ---------- Dialogue ----------

  show(line) {
    const el = this.el;
    el.dialogue.hidden = false;
    el.dialogue.dataset.who = line.who === 'JESUS' ? 'jesus' : 'foreman';
    el.speaker.textContent = line.who;
    el.line.textContent = '';
    el.sub.textContent = '';
    el.choices.replaceChildren();
    this.body.dataset.mood = line.mood || '';
    this.flag('talking', true);
    this.flag('typing', true);
    this.announce(`${line.who}: ${line.text}${line.sub ? ` ${line.sub}` : ''}`);
    const full = line.text + (line.sub ? `\n${line.sub}` : '');
    const speed = line.speed || 34;
    const typing = { line, shown: 0, elapsed: 0, done: false };
    this.typing = typing;
    this.tasks.delete(this.typeTask);
    this.typeTask = dt => {
      typing.elapsed += dt;
      const count = Math.min(full.length, Math.floor(typing.elapsed / speed));
      if (count !== typing.shown) {
        if (Math.floor(count / 3) !== Math.floor(typing.shown / 3)) this.cue('blip');
        typing.shown = count;
        this.renderTyped(line, count);
      }
      if (count >= full.length) this.finishTyping(typing);
    };
    this.tasks.add(this.typeTask);
    return typing;
  }

  // A line still typing would otherwise keep writing over whatever the box shows next.
  stopTyping() {
    this.tasks.delete(this.typeTask);
    this.typing = null;
    this.flag('talking', false);
    this.flag('typing', false);
  }

  renderTyped(line, count) {
    this.el.line.textContent = line.text.slice(0, count);
    this.el.sub.textContent = line.sub ? line.sub.slice(0, Math.max(0, count - line.text.length - 1)) : '';
  }

  finishTyping(typing) {
    if (typing.done) return;
    typing.done = true;
    typing.shown = Infinity;
    this.renderTyped(typing.line, Infinity);
    this.tasks.delete(this.typeTask);
    this.flag('talking', false);
    this.flag('typing', false);
    typing.onDone?.();
  }

  say(line, { choices } = {}) {
    const typing = this.show(line);
    const { promise, waiter } = this.pending();
    if (choices) {
      const render = () => {
        const buttons = choices.map(choice => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'choice';
          button.textContent = choice.label;
          button.addEventListener('click', () => { this.cue('select'); waiter.resolve(choice.id); }, { once: true });
          return button;
        });
        this.el.choices.replaceChildren(...buttons);
        buttons[0].focus({ preventScroll: true });
      };
      typing.onDone = render;
      if (typing.done) render();
      return promise;
    }
    const length = line.text.length + (line.sub?.length || 0);
    const linger = line.linger ?? (line.cut ? 450 : 1500 + length * 38);
    typing.advance = () => waiter.resolve();
    typing.onDone = () => {
      const stop = this.task(() => {
        if (this.time >= typing.doneAt + linger) { stop(); waiter.resolve(); }
      });
      typing.doneAt = this.time;
      promise.finally(stop).catch(() => {});
    };
    return promise;
  }

  // Tap, click, Enter or Space: finish the typewriter first, then move on.
  advance() {
    const typing = this.typing;
    if (!typing || this.el.dialogue.hidden) return;
    if (!typing.done) { this.finishTyping(typing); return; }
    if (typing.advance) { typing.advance(); typing.advance = null; }
  }

  // ---------- Wish ----------

  async upload(from, to) {
    this.el.dialogue.hidden = true;
    this.body.dataset.scene = 'upload';
    this.setUpload(from, 0);
    // It hangs at 33% for a moment, like everything else today.
    const steps = [[0.33, 700], [0.33, 600], [0.8, 500], [1, 400]];
    let progress = 0;
    for (const [to, ms] of steps) {
      const start = progress;
      const begin = this.time;
      const stop = this.task(() => {
        const t = Math.min(1, (this.time - begin) / ms);
        progress = start + (to - start) * t;
        this.setUpload(from, progress);
      });
      await this.wait(ms);
      stop();
      progress = to;
    }
    this.setUpload(to, 1);
    this.cue('upload');
    await this.wait(900);
    this.body.dataset.scene = 'wish';
  }

  setUpload(label, progress) {
    this.el.upload.textContent = label;
    this.el.uploadFill.style.width = `${Math.round(progress * 100)}%`;
  }

  // ---------- Candles ----------

  startMic() { return this.mic.start(); }
  stopMic() { this.mic.stop(); this.body.classList.remove('blowing', 'holding'); }

  async calibrate() {
    const levels = [];
    const stop = this.task(() => levels.push(this.mic.read().level));
    await this.wait(BLOW.calibrationMs);
    stop();
    this.breath = new BreathMeter({ floor: calibrate(levels).floor });
  }

  blow(round, mode) {
    const meter = mode === 'mic' && this.mic.live ? this.breath ??= new BreathMeter() : new TapWind();
    meter.setRound(round);
    const el = this.el;
    const tapping = meter instanceof TapWind;
    const final = round === this.copy.rounds.length - 1;
    this.cue('round');
    this.flag('blowing');
    this.taps = 0;
    this.body.dataset.mode = tapping ? 'finger' : 'mic';
    el.dialogue.hidden = false;
    el.dialogue.dataset.who = 'hint';
    el.speaker.textContent = this.copy.rounds[round].banner;
    // The banner's battle cry: FLA!, FORTIUS!, FORTISSIME!!
    el.meterLabel.textContent = this.copy.rounds[round].banner.split('·').pop().trim();
    el.line.textContent = tapping ? this.copy.hint.tap[round] : this.copy.hint.mic;
    el.holdLabel.textContent = tapping ? this.copy.hint.tapButton : this.copy.hint.button;
    el.sub.textContent = '';
    el.choices.replaceChildren(el.hold);
    this.stopTyping();
    el.hold.focus({ preventScroll: true });
    // Power tops out at 1.3, so the round's target (power 1) sits three quarters up the meter.
    el.meterTarget.style.bottom = `${100 / 1.3}%`;
    const { promise, waiter } = this.pending();
    const stop = this.task(dt => {
      const holding = this.holding.pointer || this.holding.key;
      this.flag('holding', holding);
      let state;
      if (meter instanceof BreathMeter) {
        const frame = this.mic.read();
        state = meter.push({ ...frame, dt, holding });
        // Blowing without holding does nothing, so say so until he holds the button.
        const nudging = this.body.classList.contains('nudge');
        const nudge = !holding && (nudging || state.unheld >= BLOW.nudgeMs);
        if (nudge !== nudging) {
          this.flag('nudge', nudge);
          el.line.textContent = nudge ? this.copy.hint.nudge : this.copy.hint.mic;
        }
        if (this.debug) el.debug.textContent = `lvl ${frame.level.toFixed(0)} flat ${frame.flatness.toFixed(2)} floor ${meter.floor.toFixed(0)} thr ${meter.threshold.toFixed(0)} tgt ${meter.target.toFixed(0)} pow ${state.power.toFixed(2)} effort ${(state.effort / 1000).toFixed(1)}s`;
      } else {
        state = meter.push({ dt, taps: this.taps });
        this.taps = 0;
      }
      this.body.style.setProperty('--power', state.power.toFixed(3));
      el.meterFill.style.height = `${Math.min(100, (state.power / 1.3) * 100)}%`;
      if (holding || meter.sinceTap < 600) this.score(state.power * dt * 0.12);
      // In the final round the stage starts to strain while Silvio is still blowing,
      // so the collapse that follows is clearly his doing.
      // On above 0.55, off below 0.4, so it doesn't flicker while the meter hovers.
      const strainingNow = this.body.classList.contains('straining');
      const straining = final && !state.done && state.power > (strainingNow ? 0.4 : 0.55);
      if (straining !== strainingNow) {
        this.flag('straining', straining);
        if (straining && !this.mic.live) this.cue('creak');
      }
      if (state.done) {
        stop();
        this.peak = Math.max(this.peak || 0, state.peak);
        this.flag('blowing', false);
        this.flag('holding', false);
        this.flag('straining', false);
        this.flag('nudge', false);
        this.holding.pointer = this.holding.key = false;
        el.choices.replaceChildren();
        el.dialogue.hidden = true;
        this.body.style.setProperty('--power', '0');
        waiter.resolve({ reason: state.done, peak: state.peak });
      }
    });
    promise.catch(stop);
    return promise;
  }

  // ---------- Continue? ----------

  countdown(text) {
    const el = this.el.countdown;
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    if (text.includes(' ')) this.flag('stalled');
  }

  coin(timeoutMs) {
    const { promise, waiter } = this.pending();
    const button = this.el.coin;
    button.disabled = false;
    button.focus({ preventScroll: true });
    const start = this.time;
    const timer = this.task(() => {
      if (this.time >= start + timeoutMs) { cleanup(); waiter.resolve(false); }
    });
    const onClick = () => {
      cleanup();
      this.flag('coined');
      this.el.coinNote.textContent = `${this.copy.coin.accepted} ${this.copy.coin.warning}`;
      this.announce(this.el.coinNote.textContent);
      waiter.resolve(true);
    };
    const cleanup = () => { timer(); button.disabled = true; button.removeEventListener('click', onClick); };
    button.addEventListener('click', onClick);
    promise.catch(cleanup);
    return promise;
  }

  // ---------- Ending ----------

  finish() {
    this.stopMic();
    this.el.dialogue.hidden = true;
    this.flag('finished');
    this.body.dataset.mood = '';
    this.scene('construction');
    this.el.highScore.textContent = String(Math.round(this.points)).padStart(6, '0');
    this.el.progressValue.textContent = `${this.copy.workOrder.progress}%`;
    this.el.nein.textContent = '';
    this.announce(this.copy.lux.dark);
    this.after(1000, () => this.el.fiat.focus({ preventScroll: true }));
  }

  nein() {
    const lines = this.copy.workOrder.nein;
    this.el.nein.textContent = `VORARBEITER: ${lines[this.neinIndex++ % lines.length]}`;
    this.cue('nein');
    this.el.progress.classList.remove('twitch');
    void this.el.progress.offsetWidth;
    this.el.progress.classList.add('twitch');
  }

  // The foreman switched the lights off. Fiat lux calls a flying saucer: it glides in through
  // the dark, stops over Jesus and beams the halo back on. The light spreads from the halo,
  // Jesus winks, the work order fades in, and the saucer waves goodbye.
  fiatLux() {
    if (!this.body.classList.contains('lights-out') || this.body.classList.contains('ufo-pass')) return;
    const halo = this.el.halo.getBoundingClientRect();
    const stage = this.el.stage.getBoundingClientRect();
    const hx = halo.left + halo.width / 2 - stage.left;
    const hy = halo.top + halo.height / 2 - stage.top;
    const ufo = this.el.ufo;
    this.el.night.style.setProperty('--hx', hx + 'px');
    this.el.night.style.setProperty('--hy', hy + 'px');
    // The saucer parks over the halo, and its beam is just long enough to reach it.
    ufo.style.setProperty('--ux', hx + 'px');
    ufo.style.setProperty('--beam', Math.max(20, hy - (ufo.offsetTop + ufo.offsetHeight * 0.72)) + 'px');
    this.flag('ufo-pass');
    this.cue('ufo');
    this.announce(this.copy.lux.visitor);
    this.after(3700, () => {
      this.flag('lux');
      this.cue('fiat');
      this.announce(this.copy.lux.announce);
    });
    this.after(4600, () => {
      this.flag('winking');
      this.after(900, () => this.flag('winking', false));
    });
    this.after(7000, () => this.el.replay.focus({ preventScroll: true }));
  }

  // ---------- Input ----------

  tap() {
    this.taps++;
    this.buzz(12);
    const button = this.el.hold;
    button.classList.remove('bump');
    void button.offsetWidth;
    button.classList.add('bump');
  }

  bind() {
    const { dialogue, hold, cake, progress } = this.el;
    dialogue.addEventListener('click', event => {
      if (event.target.closest('button')) return;
      this.advance();
    });
    const press = event => {
      if (!this.body.classList.contains('blowing')) return;
      event.preventDefault();
      if (this.body.dataset.mode === 'finger') this.tap();
      else this.holding.pointer = true;
    };
    const release = () => { this.holding.pointer = false; };
    hold.addEventListener('pointerdown', press);
    cake.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    hold.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('keydown', event => {
      if (event.target.closest?.('input, textarea')) return;
      const blowing = this.body.classList.contains('blowing');
      if (event.code === 'Space' && blowing) {
        event.preventDefault();
        // Holding Space down auto-repeats; only real presses count as taps.
        if (this.body.dataset.mode === 'finger') { if (!event.repeat) this.tap(); }
        else this.holding.key = true;
      } else if ((event.code === 'Space' || event.code === 'Enter') && !event.target.closest?.('button')) {
        if (!this.el.dialogue.hidden) { event.preventDefault(); this.advance(); }
      }
    });
    window.addEventListener('keyup', event => { if (event.code === 'Space') this.holding.key = false; });
    window.addEventListener('blur', () => { this.holding.pointer = this.holding.key = false; });
    progress.addEventListener('click', () => this.nein());
  }
}
