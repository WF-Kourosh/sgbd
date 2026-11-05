import {TheatreSound} from './audio.mjs';

(() => {
  'use strict';

  const config = {
    name: 'Silvio',
    age: 33,
    defaultTheme: 'retro',
    timings: { greeting: 4000, reveal: 11000, malfunction: 18000, collapse: 23000, impact: 1600, buried: 3000, lastwords: 29000, death: 6000, worker: 37000, construction: 45000 },
    copy: {
      birthday: 'Buon compleanno, Silvio!',
      age: '33 today. Both of us.',
      planned: 'For you, I prepared something extraordinary…',
      development: 'A surprise of biblical proportions.',
      behold: 'Behold!',
      unveiling: 'Your grand birthday surprise awaits…',
      trouble: 'Wait. What was that?',
      uhOh: 'That was not in the divine plan.',
      lastWords: 'I hope you outlive me, Silvio…',
      workerArrival: 'Mein Gott…',
      workerInspection: 'This needs a professional.',
      workerInstall: 'Erst mal: Baustelle.',
      workerPromise: 'Come back soon, Silvio. We’re on it.'
    }
  };

  const body = document.body;
  const message = document.getElementById('message-main');
  const submessage = document.getElementById('message-sub');
  const soundButton = document.getElementById('sound-button');
  const skipButton = document.getElementById('skip-button');
  const replayButton = document.getElementById('replay-button');
  const lampButton = document.getElementById('lamp-button');
  const announcement = document.getElementById('sr-announcement');
  const workerLine = document.getElementById('worker-line');
  const lastWords = document.getElementById('last-words');
  const welcome = document.getElementById('retro-welcome');
  const withSoundButton = document.getElementById('retro-watch-with-sound');
  const quietButton = document.getElementById('retro-watch-quietly');
  const controls = document.querySelector('.controls');
  const stage = document.querySelector('.stage-inner');
  const sound = new TheatreSound();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const requestedTheme = new URLSearchParams(location.search).get('theme');
  body.dataset.theme = ['cinema', 'retro'].includes(requestedTheme) ? requestedTheme : config.defaultTheme;
  document.documentElement.classList.add('js');
  body.classList.add('awaiting-start');
  controls.inert = true;
  stage.inert = true;

  let startedAt = performance.now();
  let pausedAt = document.hidden ? startedAt : null;
  let previousPhase = '';
  let lastMain = '';
  let lastSub = '';
  let lampWinkUntil = 0;
  let soundOn = false;
  let hasStarted = false;
  let choosing = false;
  let audio = null;
  let master = null;
  let impactWasActive = false;
  let lastShudder = -1;
  const activeVoices = new Set();

  function currentElapsed(now = performance.now()) {
    if (!hasStarted) return 0;
    return Math.max(0, (pausedAt === null ? now : pausedAt) - startedAt);
  }

  function phaseAt(time) {
    if (time >= config.timings.construction) return 'construction';
    if (time >= config.timings.worker) return 'worker';
    if (time >= config.timings.lastwords) return 'lastwords';
    if (time >= config.timings.collapse) return 'collapse';
    if (time >= config.timings.malfunction) return 'malfunction';
    if (time >= config.timings.reveal) return 'reveal';
    if (time >= config.timings.greeting) return 'greeting';
    return 'arrival';
  }

  function setText(main, sub) {
    if (main !== lastMain) { message.textContent = main; lastMain = main; }
    if (sub !== lastSub) { submessage.textContent = sub; lastSub = sub; }
  }

  function type(text, time, delay, speed = 42) {
    return text.slice(0, Math.max(0, Math.floor((time - delay) / speed)));
  }

  async function setSound(enabled) {
    soundOn = false;
    stopVoices();
    soundOn = await sound.setEnabled(enabled);
    audio = sound.context;
    master = sound.master;
    if (master && audio) master.gain.setValueAtTime(soundOn ? 0.18 : 0, audio.currentTime);
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.textContent = soundOn ? '♪ Sound on' : '♪ Sound off';
    return soundOn;
  }

  function note(frequency, delay, duration, wave = 'sine', volume = 0.22, endFrequency = frequency) {
    if (!soundOn || !audio || !master) return;
    try {
      const start = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.04, duration / 3));
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      activeVoices.add(oscillator);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
      oscillator.onended = () => { activeVoices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    } catch (_) { /* The birthday still works if audio is unavailable. */ }
  }

  function stopVoices() {
    for (const oscillator of activeVoices) {
      try { oscillator.stop(); } catch (_) { /* Already ended. */ }
    }
    activeVoices.clear();
  }

  // A short, low-pass noise burst gives the falling set a physical rumble.
  // Audio nodes join activeVoices so mute, skip and replay stop them too.
  function rumble() {
    if (!soundOn || !audio || !master) return;
    try {
      const duration = 0.44;
      const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
      const samples = buffer.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < samples.length; i++) {
        brown = (brown + 0.035 * (Math.random() * 2 - 1)) / 1.035;
        samples[i] = brown * 3;
      }
      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const envelope = audio.createGain();
      const start = audio.currentTime;
      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(body.dataset.theme === 'retro' ? 600 : 380, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.38, start + 0.035);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter);
      filter.connect(envelope);
      envelope.connect(master);
      activeVoices.add(source);
      source.onended = () => { activeVoices.delete(source); source.disconnect(); filter.disconnect(); envelope.disconnect(); };
      source.start(start);
      source.stop(start + duration + 0.02);
    } catch (_) { /* The visual shake still works if noise synthesis is unavailable. */ }
  }

  function playCue(phase) {
    if (!soundOn) return;
    const retro = body.dataset.theme === 'retro';
    const wave = retro ? 'square' : 'sine';
    if (phase === 'greeting' || phase === 'enabled') {
      [523.25, 659.25, 783.99].forEach((frequency, index) => note(frequency, index * 0.1, retro ? 0.2 : 0.8, wave, retro ? 0.09 : 0.18));
    } else if (phase === 'reveal') {
      [392, 493.88, 587.33, 783.99].forEach((frequency, index) => note(frequency, index * 0.13, 0.7, wave, retro ? 0.055 : 0.13));
    } else if (phase === 'malfunction') {
      note(retro ? 520 : 210, 0, 0.65, retro ? 'square' : 'sawtooth', 0.07, 95);
    } else if (phase === 'shudder') {
      rumble();
      note(retro ? 105 : 76, 0, 0.4, 'triangle', 0.18, 38);
      note(retro ? 240 : 165, 0.06, 0.32, retro ? 'square' : 'sawtooth', 0.035, 85);
    } else if (phase === 'collapse') {
      [0, 0.34, 0.7, 1.15].forEach((delay, index) => note(135 - index * 15, delay, 0.45, 'triangle', 0.17, 45));
      if (retro) note(520, 0, 1.05, 'square', 0.06, 80);
    } else if (phase === 'impact') {
      note(105, 0, 0.55, 'triangle', 0.22, 34);
      note(82, 0.12, 0.48, 'sawtooth', 0.055, 35);
      note(180, 0.38, 0.22, 'triangle', 0.09, 55);
    } else if (phase === 'lastwords') {
      [329.63, 261.63, 220].forEach((frequency, index) => note(frequency, index * 0.35, 0.8, 'sine', 0.09));
    } else if (phase === 'worker') {
      [0, 0.34, 0.68].forEach(delay => note(180, delay, 0.14, 'triangle', 0.12, 70));
    } else if (phase === 'construction') {
      note(440, 0, 0.28, wave, 0.1);
      note(554, 0.16, 0.48, wave, 0.1);
    } else if (phase === 'lamp') {
      note(660, 0, 0.35, wave, 0.1);
      note(880, 0.1, 0.48, wave, 0.1);
    }
  }

  function render(now) {
    if (!hasStarted) return;
    const time = currentElapsed(now);
    const phase = phaseAt(time);
    if (phase !== previousPhase) {
      body.dataset.phase = phase;
      if (phase === 'greeting') announcement.textContent = `${config.copy.birthday} ${config.copy.age}`;
      else if (phase === 'reveal') announcement.textContent = `${config.copy.planned} ${config.copy.development} ${config.copy.behold}`;
      else if (phase === 'malfunction') announcement.textContent = `${config.copy.trouble} ${config.copy.uhOh}`;
      else if (phase === 'lastwords') announcement.textContent = `Jesus: ${config.copy.lastWords}`;
      else if (phase === 'worker') announcement.textContent = `${config.copy.workerArrival} ${config.copy.workerInspection} ${config.copy.workerInstall} ${config.copy.workerPromise}`;
      else if (phase === 'construction') announcement.textContent = 'Miracle under construction. Buon compleanno, Silvio. The real surprise is still being built. Torna presto.';
      else if (phase === 'arrival') announcement.textContent = '';
      if (previousPhase) playCue(phase);
      previousPhase = phase;
    }

    if (phase === 'greeting') {
      const local = time - config.timings.greeting;
      setText(type(config.copy.birthday, local, 150), type(config.copy.age, local, 1600));
    } else if (phase === 'reveal') {
      const local = time - config.timings.reveal;
      if (local < 4300) {
        setText(type(config.copy.planned, local, 100, 30), type(config.copy.development, local, 1600, 31));
      } else {
        setText(type(config.copy.behold, local, 4300, 55), type(config.copy.unveiling, local, 5000, 35));
      }
    } else if (phase === 'malfunction' || phase === 'collapse') {
      const local = time - config.timings.malfunction;
      setText(type(config.copy.trouble, local, 100, 40), type(config.copy.uhOh, local, 1500, 35));
    } else {
      setText('', '');
    }

    if (workerLine) {
      const local = time - config.timings.worker;
      const workerText = phase !== 'worker' ? '' : local < 1600 ? config.copy.workerArrival : local < 4200 ? config.copy.workerInspection : local < 6200 ? config.copy.workerInstall : config.copy.workerPromise;
      if (workerLine.textContent !== workerText) workerLine.textContent = workerText;
    }
    if (lastWords) {
      const lastWordsText = phase === 'lastwords' ? type(config.copy.lastWords, time - config.timings.lastwords, 700, 60) : '';
      if (lastWords.textContent !== lastWordsText) lastWords.textContent = lastWordsText;
    }
    body.classList.toggle('gesturing', phase === 'reveal');
    body.classList.toggle('worker-installing', phase === 'worker' && time >= config.timings.worker + 4200);
    // stage-shudder lasts 1.5s and visibly moves at 92% and 96% of each cycle.
    // Gate once per cycle, rather than creating sounds on every animation frame.
    if (phase === 'malfunction' && pausedAt === null) {
      const local = time - config.timings.malfunction;
      const cycle = Math.floor(local / 1500);
      if (local % 1500 >= 1380 && cycle !== lastShudder) {
        lastShudder = cycle;
        playCue('shudder');
      }
    }
    const collapseLocal = time - config.timings.collapse;
    const impact = phase === 'collapse' && collapseLocal >= config.timings.impact && collapseLocal < config.timings.buried;
    const buried = collapseLocal >= config.timings.buried;
    body.classList.toggle('collapse-impact', impact);
    body.classList.toggle('buried', buried);
    const dead = time >= config.timings.lastwords + config.timings.death;
    body.classList.toggle('dying', phase === 'lastwords' && !dead);
    body.classList.toggle('dead', dead);
    if (impact && !impactWasActive) playCue('impact');
    impactWasActive = impact;
    const scheduledWink = time >= 6800 && time < 7500;
    const blinking = (time >= 2100 && time < 2350) || (time >= 19200 && time < 19450) || (impact && collapseLocal < config.timings.impact + 450);
    body.classList.toggle('winking', !dead && (scheduledWink || time < lampWinkUntil));
    body.classList.toggle('blinking', !dead && blinking);
    requestAnimationFrame(render);
  }

  function goToConstruction() {
    if (!hasStarted) return;
    stopVoices();
    startedAt = (pausedAt === null ? performance.now() : pausedAt) - config.timings.construction;
    lampWinkUntil = 0;
    body.classList.remove('winking', 'blinking', 'gesturing', 'worker-installing', 'collapse-impact', 'dying');
    body.classList.add('buried', 'dead');
    impactWasActive = false;
    lastShudder = -1;
    previousPhase = '';
    body.dataset.phase = 'construction';
  }

  function replay() {
    if (!hasStarted) return;
    stopVoices();
    body.classList.remove('lamp-on', 'winking', 'blinking', 'gesturing', 'worker-installing', 'collapse-impact', 'buried', 'dying', 'dead');
    impactWasActive = false;
    lastShudder = -1;
    lampButton.setAttribute('aria-pressed', 'false');
    lampWinkUntil = 0;
    previousPhase = '';
    // Return to arrival before restarting so CSS can replay its entrance animations.
    body.dataset.phase = 'arrival';
    startedAt = pausedAt === null ? performance.now() : pausedAt;
    if (reducedMotion.matches) goToConstruction();
  }

  async function chooseSound(enabled) {
    if (choosing || hasStarted) return;
    choosing = true;
    withSoundButton.disabled = true;
    quietButton.disabled = true;
    await setSound(enabled);
    hasStarted = true;
    body.classList.remove('awaiting-start');
    body.classList.add('started');
    welcome.inert = true;
    controls.inert = false;
    stage.inert = false;
    startedAt = performance.now();
    pausedAt = document.hidden ? startedAt : null;
    body.classList.toggle('paused', document.hidden);
    if (document.hidden) sound.pause();
    if (reducedMotion.matches) goToConstruction();
    requestAnimationFrame(render);
    soundButton.focus({ preventScroll: true });
  }

  withSoundButton.addEventListener('click', () => chooseSound(true));
  quietButton.addEventListener('click', () => chooseSound(false));
  soundButton.addEventListener('click', async () => {
    soundButton.disabled = true;
    try {
      await setSound(!soundOn);
      if (soundOn) playCue('enabled');
    } finally { soundButton.disabled = false; }
  });

  skipButton.addEventListener('click', goToConstruction);
  replayButton.addEventListener('click', replay);
  lampButton.addEventListener('click', () => {
    if (!body.classList.contains('lamp-on')) {
      body.classList.add('lamp-on');
      lampButton.setAttribute('aria-pressed', 'true');
      if (!body.classList.contains('dead')) lampWinkUntil = currentElapsed() + 700;
      playCue('lamp');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!hasStarted) return;
    const now = performance.now();
    if (document.hidden && pausedAt === null) {
      pausedAt = now;
      body.classList.add('paused');
      if (audio && audio.state === 'running') audio.suspend().catch(() => {});
    } else if (!document.hidden && pausedAt !== null) {
      startedAt += now - pausedAt;
      pausedAt = null;
      body.classList.remove('paused');
      if (soundOn && audio) audio.resume().catch(() => {});
    }
  });
  reducedMotion.addEventListener?.('change', event => { if (event.matches && hasStarted) goToConstruction(); });

  withSoundButton.focus({ preventScroll: true });
})();

