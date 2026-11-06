// Every word the birthday says lives here, so jokes can change without touching the machinery.
// English carries the story, Italian is for Silvio, German for the foreman, Latin for the solemn bits.

export const config = {
  name: 'Silvio',
  age: 33,
};

const J = 'JESUS';
const F = 'VORARBEITER';

export const copy = {
  intro: [
    { who: J, text: 'Silvio! Buon compleanno!' },
    { who: J, text: '33 today. Same as me. Great age.', sub: 'Nothing bad ever happens at 33.' },
    { who: J, text: 'Now, your present. See this box?', sub: 'Empty. Before you judge me, hear me out.', mood: 'box' },
    { who: J, text: 'You wish it, you blow out the candles, I miracle it inside.', sub: 'Water into wine, wish into box. Zero shipping time.', mood: 'gift' },
  ],
  wish: {
    prompt: { who: J, text: 'Close your eyes. Wish for your present.', sub: 'Don’t say it out loud. I’ll hear it.' },
    button: 'I wished ✓',
    uploading: 'VOTUM TRANSMITTITUR…',
    received: 'VOTUM RECEPTUM ✓',
    reaction: [
      { who: J, text: 'Oh. Oh, wow. Ambitious.', sub: 'Bold thing to ask the Son of God for, Silvio… but I can work with that.' },
      { who: J, text: 'Blow out the candles, and it’s in the box.', sub: 'I promise. And I always keep my promises.', mood: 'gift' },
    ],
  },
  mic: {
    prompt: { who: J, text: 'One thing: I need your microphone.', sub: 'Nothing leaves this device. Seal of confession.' },
    choices: [
      { id: 'mic', label: '🎤 Use my lungs' },
      { id: 'finger', label: '☝ No mic, use finger' },
    ],
    denied: { who: J, text: 'No microphone? Doubting Thomas, huh?', sub: 'Fine. Use your finger and poke the candles out.' },
    calibrating: { who: J, text: 'Shh… SILENTIUM.', sub: 'Let me listen to the room first.', linger: 0 },
  },
  hint: {
    mic: 'Hold the button and blow into the mic',
    nudge: 'I hear you! Now hold the button while you blow.',
    tap: ['Tap to blow! Keep tapping.', 'Faster! More taps!', 'FASTER!!! Everything you’ve got!'],
    button: 'Hold & blow',
    tapButton: 'Tap! Tap! Tap!',
  },
  rounds: [
    {
      banner: 'ROUND 1 · FLA!',
      before: [],
      after: [
        { who: J, text: 'Ha! They came back from the dead.', sub: 'Runs in the family.' },
        { who: J, text: 'That was a gentle breeze, Silvio.', sub: 'A miracle that size needs real wind. Harder!' },
      ],
    },
    {
      banner: 'ROUND 2 · FORTIUS!',
      before: [],
      after: [
        { who: J, text: 'Better! But they’re eternal flames.', sub: 'My dad’s idea.' },
        { who: J, text: 'Last one. Give me everything.', sub: 'Blow like it’s the Red Sea!' },
      ],
    },
    {
      banner: 'ROUND 3 · FORTISSIME!!',
      before: [],
      after: [],
    },
  ],
  failsafe: { who: J, text: 'Close enough. I’m generous.', sub: 'Divine grace covers the remaining 20%.' },
  victory: 'VENI, VIDI, FLAVI',
  // The last gust is miracle-sized: it keeps going after Silvio stops, and Jesus notices.
  quake: [
    { who: J, text: 'YES! And now, by the power vested in m—', mood: 'gift', speed: 26, cut: true },
    { who: J, text: 'Silvio… you can stop now.', mood: 'worried', speed: 28, linger: 650, cue: 'screw' },
    { who: J, text: 'You already stopped?! That’s just the shockwa—', mood: 'panic', speed: 22, cut: true, linger: 650 },
  ],
  culpa: 'MEA CULPA',
  destroyed: 33000,
  lastWords: [
    { who: J, text: 'Silvio… I said harder.', sub: 'Not structurally harder.', mood: 'hurt' },
    { who: J, text: 'Your present… I had it ready.', sub: 'You would have loved it.', mood: 'hurt' },
    { who: J, text: 'Consummatum e—', cut: true, speed: 90, mood: 'hurt' },
  ],
  gameOver: 'GAME OVER',
  continuePrompt: 'CONTINUE?',
  countdownFrom: 9,
  countdownStall: 3,
  days: 'DAYS',
  resurrexit: 'RESURREXIT… MOX',
  epitaph: 'REQUIESCAT IN PIZZA',
  coin: {
    button: 'Insert coin · INSERE NUMMUM',
    accepted: 'Coin accepted. Resurrection takes 3 days.',
    warning: 'Your present ships with him. Please don’t blow on anything until then.',
  },
  foreman: [
    { who: F, text: 'Mein Gott…', sub: 'Total structural failure. Definitely not DIN-compliant.' },
    { who: F, text: 'Wer hat hier so gepustet?!', sub: 'Who blew this hard without a wind permit?' },
    { who: F, text: 'Und das Geschenk? …Leer. Natürlich.', sub: 'Box is empty. Messiah is flat. Classic Friday.', mood: 'box' },
    { who: F, text: 'Erst mal: Baustelle.', sub: 'Habemus Baustelle.', mood: 'install' },
  ],
  lightsOut: { who: F, text: 'So. Feierabend.', sub: 'Licht aus. Nobody touches anything for three days.' },
  lux: {
    button: 'Fiat lux',
    hint: 'let there be light',
    dark: 'The foreman switched off the lights. Press Fiat lux to bring them back.',
    visitor: 'A small flying saucer glides in through the dark and stops above Jesus.',
    announce: 'It beams the halo back on. Light spreads across the stage, and the work order appears.',
  },
  workOrder: {
    title: 'WORK ORDER #XXXIII',
    rows: [
      ['Client', 'SILVIO (33)'],
      ['Ordered by', 'J. (temporarily unavailable)'],
      ['Item', '1× present, made to wish'],
      ['Contents', 'Known only to J.'],
      ['Box', 'Empty. Under the stage.'],
      ['Cause of delay', 'Excessive lung power'],
      ['ETA', '3 days (resurrection pending)'],
      ['Status', 'OPUS INTERRUPTUM · BAUSTELLE'],
    ],
    progress: 33,
    nein: [
      'Nein.',
      'Immer noch nein.',
      'Drei Tage, hab ich gesagt. Three days!',
      'Clicking faster does not speed up a resurrection.',
      'It is a miracle, not Amazon Prime.',
      'Feierabend! Buon compleanno, Silvio. Go eat some cake.',
      'Nein.',
    ],
    highScores: [
      ['SILVIO', 'BLOW POWER', null],
      ['MOSES', 'SEAS PARTED', '1'],
      ['BIG BAD WOLF', 'HOUSES BLOWN', '2'],
    ],
  },
  announcements: {
    candlesOut: 'The candles go out.',
    relight: 'The candles relight.',
    collapse: 'The stage collapses on Jesus.',
    dead: 'Jesus has died.',
  },
};
