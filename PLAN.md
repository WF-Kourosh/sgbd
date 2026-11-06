# Silvio XXXIII: Arcade Miracle (redesign plan)

Branch: `arcade-miracle`. The arcade (retro) version becomes the only experience. Cinema is removed on
this branch but stays in `main`'s history.

## Why a branch, not a new project

- Same subject, same jokes, same 33/Jesus premise. The retro visuals, synth sound (`audio.mjs`),
  sound opt-in, reduced-motion handling and tests are all reusable.
- `jacbd` gives us only the **idea** of blowing out candles and its technical lessons (noise calibration,
  hold-to-blow, fallbacks). The candle code is written again here, not copied.
- GitHub Pages already deploys from this repo. Merging the branch into `main` is the release.

## The big change: from a 33-second film to something you play

Today's retro version is a fixed timeline that Silvio only watches. The new version is a
**scene machine**: some scenes wait for Silvio to do something (wish, blow, insert coin) before
the story moves on. The blowing is what makes the stage collapse, so the disaster is his fault.

## Story beats

| # | Scene | What happens | Silvio does |
|---|-------|--------------|-------------|
| 0 | **Insert coin** | Arcade attract screen: `JESUS & SILVIO: 33 EACH`, blinking `PRESS START`. Sound choice kept (HOLY NOISE / SILENT BUT BLESSED). | Press start (this click also unlocks audio) |
| 1 | **Party for two** | Jesus behind a big cake with two **3** candles (mirrored, facing each other: one for each of them). A glowing gift box sits beside him. Dialogue box with typewriter text: *"Buon compleanno, Silvio! 33. Same as me. Great age. Nothing bad ever happens at 33."* / *"I got you something… miraculous."* | Tap to advance dialogue |
| 2 | **Make a wish** | *"Rules are rules. Wish first, then candles, then present. Trust me, wishes are kind of my thing."* Jesus closes his eyes and nods knowingly (he already heard it). `VOTUM TRANSMITTITUR…` progress bar. The wish is never typed or shown: the only one who could grant it is about to die. | Close eyes, wish silently, tap when ready |
| 3 | **Blow: round 1** | Mic asks permission in character (*"Lend me your lungs"*). Arcade `BLOW POWER` meter. Flames bend, then **relight** (trick candles). *"That's it? I've felt stronger breezes at Pentecost."* | Blow into the mic (or the fallback) |
| 4 | **Blow: round 2** | `HARDER!` Flames go out and come back again. Banner flaps, a screw pings loose (foreshadowing). *"Harder, Silvio! Like you mean it!"* | Blow harder |
| 5 | **Blow: round 3** | `GIVE ME EVERYTHING`. Candles go out for good, `K.O.!`-style text… and the wind keeps going. The stage shudders, the arch tilts, and the existing malfunction cues lead into the **collapse**. | One mighty blow |
| 6 | **Last words** | Jesus pinned under the wreckage. The heart HUD drains. *"Silvio… I said harder. Not structurally harder."* / *"Your present… it's… in the…"* He dies mid-sentence, so the present is never revealed. | Watch, guiltily |
| 7 | **Continue?** | Classic arcade `CONTINUE? 9… 8…` countdown that stalls at **3** and turns into `RESURRECTION IN 3 DAYS`. An `INSERT COIN` button answers *"Please wait 3 days. He always comes back."* | Press the useless button |
| 8 | **Foreman** | The German foreman arrives (kept from the current version: *"Mein Gott…"*, *"Erst mal: Baustelle."*), tapes off the wreck and pins up a work order. | Watch |
| 9 | **Under construction (new)** | Replaces the static sign with an arcade **work order + loading screen** (details below). | Read, replay |

No bonus stage and no date-locked epilogue: there's no real present yet. If one appears later,
a "He is risen" scene can be added on top without changing anything else.

### Better "under construction"

The current ending is a plain sign. The new one is an in-game screen that delivers the punchline:

```
╔══ WORK ORDER #XXXIII ═══════════════════╗
  CLIENT ........ SILVIO (33)
  ORDERED BY .... J. (temporarily unavailable)
  ITEM .......... 1× wish (contents known only to J.)
  CAUSE OF DELAY  Excessive lung power
  ETA ........... 3 days (resurrection pending)
  STATUS ........ BAUSTELLE
  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░ 33%
╚═════════════════════════════════════════╝
  HIGH SCORES   1. SILVIO  BLOW POWER 9001  STAGES DESTROYED 1
```

- The progress bar crawls and gets stuck at 33%. Clicking it gives a foreman reply (*"Nein."*).
- The high score uses Silvio's real measured blow peak from round 3.
- `Fiat lux` (the lamp) and `Replay` stay.

## Candle blowing (inspired by `jacbd`, written again)

Only the idea and the lessons come over: no balloon game, particles or audio files. What the new
`js/blow.mjs` does, and where it improves on jacbd:

- **Breath, not noise.** jacbd averages the whole lower half of the spectrum, so talking, music or a
  clap can count as a blow. Blowing on a mic is broadband, low-frequency rumble that lasts. The new
  detector looks at low-band energy *and* spectral flatness and requires it to last ~250 ms, so voices
  and claps are ignored.
- **Calibration that keeps learning.** jacbd measures the room once. The new one measures ~1 s of room
  noise up front, then keeps a slow-moving noise floor while nobody is blowing (it adapts if a TV is on).
  The threshold is the floor plus a margin, clamped to sane bounds.
- **Mic tuned for breath.** `getUserMedia` with echo cancellation, noise suppression and auto gain
  turned **off** (they squash exactly the signal we need).
- **Rounds.** Each round's target is the calibrated threshold × 1 / ×1.25 / ×1.5, capped so it can
  always be reached. A round also succeeds after ~8 s of real effort (*"Close enough. I'm generous."*).
- **Hold to blow.** Kept from jacbd: Silvio holds the cake while blowing, so room noise can't blow out
  the candles by itself.
- **Fallbacks.** Mic denied or missing → swipe across the flames on touch, or hold **Space** on desktop.
- **Live feedback.** Flames bend with the breath, and the `BLOW POWER` meter shows the current level and
  the round's target line.
- **Clean up.** The mic is released right after round 3 (or on skip/replay).
- **Testable.** Calibration, threshold, round scaling and failsafe are pure functions with unit tests.

## Code layout (no build step, still GitHub Pages)

```
index.html          the arcade experience (replaces cinema)
css/arcade.css      written fresh in the retro look (Impact + Courier New system fonts, no downloads)
js/main.js          wiring: sound choice, buttons, static copy
js/copy.mjs         config + all dialogue/copy: one place to edit jokes
js/story.mjs        the screenplay (pure, testable with a fake director)
js/director.mjs     runs the screenplay: clock, dialogue box, input
js/blow.mjs         breath math: calibration, threshold, rounds, failsafe (pure)
js/mic.mjs          microphone access and analysis
js/sound.mjs        TheatreSound + arcade cues
tests/*.test.mjs    node --test
```

Removed on this branch: `app.js`, `styles.css`, `timeline.mjs`, `retro.*`, painted puppet PNGs,
`jesus-cinema.svg`. Old `?theme=` links redirect to `/`.

## Constraints to keep

- Sound only after an explicit choice. Audio errors never block the story.
- Mic audio stays on the device, and the mic is released as soon as round 3 ends.
- Reduced motion: no shaking or flashing; the collapse becomes a fade.
- Phone first: one-thumb controls, works at 360 px wide, mic needs HTTPS (Pages provides it).
- Works without JS: the static "Miracle under construction" fallback stays.

## Tests

- Scene order, and which scenes wait for input
- Blow math: calibration clamps, adaptive noise floor, sustained-breath gate ignores short spikes,
  round escalation, the failsafe always fires
- Fallback chain: mic → swipe/space
- Countdown stalls at 3
- Copy invariants: last words cut off before the present is named; the foreman speaks only after the death

## Build order

1. Scaffold the new layout, port retro visuals into `index.html` + `css/arcade.css`, delete cinema
2. Scene machine + dialogue box + `script.mjs` (beats 0–2, tap-through)
3. New `blow.mjs` + cake candles + three blow rounds + fallbacks (beats 3–5)
4. Collapse / last words / continue countdown (beats 6–7), reusing the existing collapse CSS and cues
5. Foreman + new work-order ending (beats 8–9)
6. Tests, phone pass, README

## Languages: English, Italian, German + Latin

English carries the story. Italian is for Silvio, German for the foreman, and Latin is Jesus's
"official" voice and the arcade's fake-solemn labels. Latin candidates (pick the best during writing):

- Start screen: `INSERE NUMMUM` (insert coin) under `PRESS START`
- Wish screen: `VOTUM TRANSMITTITUR…` (wish uploading…)
- Blow rounds: `FLA!` → `FORTIUS!` → `FORTISSIME!!` (blow! / harder! / hardest!!)
- Round 3 success: `VENI, VIDI, FLAVI` (I came, I saw, I blew)
- Collapse: `MEA CULPA` stamped on Silvio's side of the HUD
- Last words: *"Consummatum est… no wait, the present isn't…"* (cuts off)
- Game over: `REQUIESCAT IN PIZZA`
- Continue screen: `RESURREXIT… MOX` (risen… soon)
- Foreman: *"Habemus Baustelle."*
- Work order status: `OPUS INTERRUPTUM`. Footer: `ERRARE HUMANUM EST, SOFFIARE DIVINUM`
- Lamp button stays `Fiat lux`

## The wish

Silvio wishes silently and the wish is never revealed. It doesn't need to be: Jesus was going to make
it come true, and Silvio's own blowing kills him. The punchline is the death; the work order and the
"3 days" only twist the knife.
