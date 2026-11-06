# Jesus & Silvio · XXXIII

An arcade birthday for Silvio, who turns 33, the same age as Jesus. Jesus has a cake for both of them
and an empty box. The present is whatever Silvio wishes for: he wishes, blows out the candles, and Jesus
miracles it into the box. Silvio blows into his microphone, Jesus keeps asking for harder, and the stage
comes down on him before he can deliver. His last words: the present was ready, and Silvio would have
loved it. A `CONTINUE?` countdown stalls at **3 DAYS**, the German foreman arrives, and the ending
is a work order: *Miracle under construction.*

## Preview locally

```sh
python -m http.server 8765
```

Open `http://localhost:8765/`. The microphone only works on `localhost` or HTTPS (GitHub Pages is HTTPS).

- **HOLY NOISE!** starts with sound, **SILENT BUT BLESSED** without. The sound button changes it anytime.
- Tap the dialogue (or press Enter/Space) to skip ahead. Lines also move on by themselves.
- At the end the foreman switches the lights off. **Fiat lux** calls a small flying saucer (Fiat Lux is
  also a UFO religion): it beams the halo back on, the light spreads, and the work order appears.
  Watch Jesus. **Replay** starts again.
- No microphone, or you'd rather not: tap the button (or the cake, or Space) to blow. Each round needs more
  taps, faster: about 10, then 19, then 30 taps.
- `?debug=mic` shows the live mic numbers (level, flatness, noise floor, threshold, target) for tuning.
- `?speed=3` plays the story three times faster.

## How it's built

No build step and no backend. Everything is local: inline SVG characters, CSS scenery and synthesized sound.

| File | What it does |
|---|---|
| `js/copy.mjs` | Every line of dialogue and label (English, Italian, German, Latin). Change jokes here. |
| `js/story.mjs` | The screenplay, scene by scene. It only talks to a director, so tests can run it. |
| `js/director.mjs` | Runs the screenplay on the page: one animation-frame clock, typewriter dialogue, input. |
| `js/blow.mjs` | Candle-blowing math: calibration, adaptive noise floor, breath vs. voice, rounds, failsafe. |
| `js/mic.mjs` | Microphone access and analysis. Audio is analysed in the tab, never recorded or sent. |
| `js/sound.mjs` | Synthesized sound effects, started only after an explicit sound choice. |
| `css/arcade.css` | Stage, characters, collapse, overlays. Sizes follow the stage, from phone to desktop. |

### Blowing out the candles

1. One second of silence measures the room. The median ignores a cough.
2. Silvio holds the button (or the cake, or Space) while blowing, so room noise alone does nothing.
3. A blow counts when low-frequency energy reaches the round's target for about a quarter second.
   Short claps don't last long enough. Voices are harmonic (low spectral flatness) and only count half.
4. Each round needs more breath (×1, ×1.2, ×1.4), capped so a phone mic can always reach it.
5. While nobody is blowing, the noise floor keeps adapting to the room.
6. After about 8 seconds of real effort a round succeeds anyway: *"Close enough. I'm generous."*

Browser voice processing (echo cancellation, noise suppression, auto gain) is turned off, because it
removes exactly the rumble of a blow.

Without a microphone, every tap is a gust and the wind dies down between taps. Below a round's pace
(1, 1.8, then 2.5 taps per second) the meter only drains, so each round needs more taps, faster.

In the last round the stage starts to strain while Silvio is still blowing. The moment the candles go
out it starts coming down, and Jesus notices the gust is still going after Silvio stopped.

## Checks

```sh
node --test tests/
```

Tests cover the blow math (calibration, sustain gate, voice penalty, adaptive floor, failsafe, tap
mode pace), the story order (wish before candles, two relights, mic released before the collapse,
no pause between the last blow and the quake, death before the foreman, countdown stalling at 3,
lights out before the ending) and sound opt-in.

Paused tabs pause the story. With reduced motion, nothing shakes or flies and the collapse is a fade.
Without JavaScript, a static "Miracle under construction" page is shown.

## GitHub Pages

Deploy from the root of `main`. All paths are relative. `retro.html` redirects old links here.
