// The screenplay. It only talks to a director (see director.mjs), so tests can run it with a fake one.
// Scenes that wait for Silvio: the wish, the mic choice, the three blow rounds and the coin slot.

export async function story(d, c) {
  await party(d, c);
  await wish(d, c);
  const mode = await lungs(d, c);
  await blowRounds(d, c, mode);
  await collapse(d, c);
  await lastWords(d, c);
  await continueScreen(d, c);
  await foreman(d, c);
  d.finish();
}

export async function party(d, c) {
  d.scene('party');
  d.candles('lit');
  d.lives(3);
  await d.wait(1100);
  for (const line of c.intro) await d.say(line);
}

export async function wish(d, c) {
  d.scene('wish');
  await d.say(c.wish.prompt, { choices: [{ id: 'wished', label: c.wish.button }] });
  d.flag('eyes-closed');
  await d.upload(c.wish.uploading, c.wish.received);
  d.flag('eyes-closed', false);
  for (const line of c.wish.reaction) await d.say(line);
}

// Returns 'mic' or 'finger'.
export async function lungs(d, c) {
  d.scene('lungs');
  const choice = await d.say(c.mic.prompt, { choices: c.mic.choices });
  if (choice === 'mic' && await d.startMic()) {
    d.show(c.mic.calibrating);
    await d.calibrate();
    return 'mic';
  }
  if (choice === 'mic') await d.say(c.mic.denied);
  return 'finger';
}

export async function blowRounds(d, c, mode) {
  for (let round = 0; round < c.rounds.length; round++) {
    const r = c.rounds[round];
    const last = round === c.rounds.length - 1;
    d.scene(`round-${round + 1}`);
    for (const line of r.before) await d.say(line);
    d.banner(r.banner);
    const result = await d.blow(round, mode);
    d.cue('whoosh');
    d.flag(`wind-${round + 1}`);
    if (round === 1) d.cue('screw');
    if (last) {
      d.candles('gone');
      d.stopMic();
      d.banner(c.victory);
      d.cue('victory');
    } else {
      d.candles('out');
      d.announce(c.announcements.candlesOut);
      await d.wait(1100);
      d.candles('lit');
      d.cue('relight');
      d.announce(c.announcements.relight);
      await d.wait(600);
    }
    if (result.reason === 'failsafe') await d.say(c.failsafe);
    for (const line of r.after) await d.say(line);
  }
}

export async function collapse(d, c) {
  d.scene('quake');
  d.cue('creak');
  d.cue('shake');
  for (const line of c.quake) await d.say(line);
  d.scene('collapse');
  d.quiet();
  d.announce(c.announcements.collapse);
  d.cue('crack');
  await d.wait(700);
  d.cue('crash');
  await d.wait(1300);
  d.cue('impact');
  d.flag('buried');
  d.lives(0);
  d.score(c.destroyed);
  d.banner(c.culpa);
  await d.wait(2400);
}

export async function lastWords(d, c) {
  d.scene('lastwords');
  for (const line of c.lastWords) await d.say(line);
  d.flag('dead');
  d.cue('silence');
  d.announce(c.announcements.dead);
  await d.wait(1800);
}

export async function continueScreen(d, c) {
  d.quiet();
  d.scene('gameover');
  d.cue('gameover');
  await d.wait(1600);
  d.scene('continue');
  for (let n = c.countdownFrom; n >= c.countdownStall; n--) {
    d.countdown(String(n));
    d.cue('tick');
    await d.wait(n === c.countdownStall ? 1800 : 850);
  }
  d.countdown(`${c.countdownStall} ${c.days}`);
  d.cue('stall');
  await d.wait(900);
  if (await d.coin(9000)) {
    d.cue('coin');
    await d.wait(3600);
  }
}

export async function foreman(d, c) {
  d.scene('foreman');
  d.cue('steps');
  await d.wait(1600);
  for (const line of c.foreman) {
    if (line.mood === 'install') {
      d.flag('installing');
      d.cue('tape');
    }
    await d.say(line);
  }
  d.cue('hammer');
}
