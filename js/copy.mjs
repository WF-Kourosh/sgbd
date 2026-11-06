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
    { who: J, text: 'Now, your present. See this box?', sub: 'Empty.', mood: 'box' },
    { who: J, text: 'Because this year, you choose.', sub: 'Anything you want. Anything at all.', mood: 'gift' },
    { who: J, text: 'You wish. You blow. I fill the box.', sub: 'Water into wine, wish into box. My specialty.' },
  ],
  wish: {
    prompt: { who: J, text: 'Close your eyes. Wish for your present.', sub: 'Don’t say it out loud. I’ll hear it.' },
    button: 'I wished ✓',
    uploading: 'VOTUM TRANSMITTITUR…',
    received: 'VOTUM RECEPTUM ✓',
    reaction: [
      { who: J, text: 'Oh. Oh! Ambitious.', sub: '…I can work with that.' },
      { who: J, text: 'Blow out the candles, and it’s in the box.', sub: 'I promise. And I always keep my promises.', mood: 'gift' },
    ],
  },
  mic: {
    prompt: { who: J, text: 'One thing: I need your microphone.', sub: 'Divine technology. Nothing leaves this phone.' },
    choices: [
      { id: 'mic', label: '🎤 Use my lungs' },
      { id: 'finger', label: '☝ No mic, use finger' },
    ],
    denied: { who: J, text: 'No microphone? Fine. Use your finger.', sub: 'I once walked on water without a boat.' },
    calibrating: { who: J, text: 'Shh… SILENTIUM.', sub: 'Let me listen to the room first.' },
  },
  hint: {
    mic: 'Hold the button and blow into the mic',
    tap: ['Tap to blow! Keep tapping.', 'Faster! More taps!', 'FASTER!!! Everything you’ve got!'],
    button: 'Hold & blow',
    tapButton: 'Tap! Tap! Tap!',
  },
  rounds: [
    {
      banner: 'ROUND 1 · FLA!',
      before: [],
      after: [
        { who: J, text: 'Ha! Trick candles. Classic.' },
        { who: J, text: 'That was a breeze, Silvio.', sub: 'A miracle this size needs real wind.' },
      ],
    },
    {
      banner: 'ROUND 2 · FORTIUS!',
      before: [{ who: J, text: 'Harder!' }],
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
  failsafe: { who: J, text: 'Close enough. I’m generous.' },
  victory: 'VENI, VIDI, FLAVI',
  // The last gust is miracle-sized: it keeps going after Silvio stops, and Jesus notices.
  quake: [
    { who: J, text: 'YES! And now, by the power vested in m—', mood: 'gift', speed: 26, cut: true },
    { who: J, text: 'Silvio… you can stop now.', mood: 'worried', speed: 28, linger: 650, cue: 'screw' },
    { who: J, text: 'You already stopped?! Then who’s still blo—', mood: 'panic', speed: 22, cut: true },
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
    { who: F, text: 'Mein Gott…' },
    { who: F, text: 'Wer hat hier so gepustet?', sub: 'Who blew this hard?' },
    { who: F, text: 'Und das Geschenk?', sub: '…Leer. Natürlich.', mood: 'box' },
    { who: F, text: 'This needs a professional.' },
    { who: F, text: 'Erst mal: Baustelle.', mood: 'install' },
    { who: F, text: 'Habemus Baustelle.' },
  ],
  lightsOut: { who: F, text: 'So. Feierabend.', sub: 'Licht aus.' },
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
    nein: ['Nein.', 'Immer noch nein.', 'Drei Tage, hab ich gesagt.', 'Nein.'],
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
