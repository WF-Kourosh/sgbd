# Silvio XXXIII

A 33-second painted puppet-theater birthday film. Jesus and Silvio celebrate turning 33 together. Jesus walks toward a covered surprise and pulls its cord; a screw drops, the banner sags, and the set falls apart. His final birthday wish gives way to the construction foreman, who plants posts, rolls out tape, and installs the ending.

- Rebuilt Sacred Cinema: `/` (also `/?theme=cinema`)
- Preserved Cursed Retro Internet prototype: `/retro.html?theme=retro` (also `/?theme=retro`)

## Preview locally

From this directory run:

```sh
python -m http.server 8765
```

Open `http://localhost:8765/` or `http://localhost:8765/?theme=retro`. Sacred Cinema waits at an opening invitation: **A miracle with fanfare** unlocks audio through that click, and **A quiet miracle** starts silently. Retro has its own setup window with **HOLY NOISE!** and **SILENT BUT BLESSED**. Each experience begins after the choice, and the sound button can change it anytime. Use **Pause** in Cinema to hold a scene, **Skip intro** to see the ending, and **Replay** to start over.

`timeline.mjs` defines all scene positions, expressions, dialogue and sound cue times. `app.js` renders that clock, builds the layered painted puppets from transparent sprite sheets, and handles controls. `audio.mjs` creates synthesized audio only after an explicit sound choice, with a bounded startup attempt so playback can continue quietly if audio is unavailable. Playback pauses when the tab is hidden; reduced-motion visitors get the final birthday scene after the opening choice. Static birthday content remains available without JavaScript. `retro.html`, `retro.css` and `retro.js` preserve the earlier prototype.

All assets are local. The painted puppet sheets, scenery and wreckage are in `assets/`; SVG viewport clips isolate the puppet parts without changing the source images. The character prompt briefs are in `assets/puppet-prompts.md`.

## Checks

```sh
node --test tests/audio.test.mjs tests/timeline.test.mjs tests/retro-start.test.mjs
node --check app.js
```

Tests cover act boundaries, the last words preceding the foreman, persistent fallen scenery, construction order, phone-size calculations, sound opt-in, the Retro opening choices, and the silence around the final wish.

## GitHub Pages

Configure GitHub Pages to deploy from the root of the `main` branch, then push the chosen version. All runtime assets use relative paths; there is no build step or backend. The retro query remains a review link to the preserved prototype.
