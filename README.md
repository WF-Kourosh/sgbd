# Silvio XXXIII

A 33-second painted puppet-theater birthday film. Jesus and Silvio celebrate turning 33 together. Jesus walks toward a covered surprise and pulls its cord; a screw drops, the banner sags, and the set falls apart. His final birthday wish gives way to the construction foreman, who plants posts, rolls out tape, and installs the ending.

- Rebuilt Sacred Cinema: `/` (also `/?theme=cinema`)
- Preserved Cursed Retro Internet prototype: `/retro.html?theme=retro` (also `/?theme=retro`)

## Preview locally

From this directory run:

```sh
python -m http.server 8765
```

Open `http://localhost:8765/` or `http://localhost:8765/?theme=retro`. Sound is enabled by default; browsers that block autoplay unlock it on the first tap or keypress. The sound button mutes it. Use **Pause** to hold a scene, **Skip intro** to see the ending, and **Replay** to start over.

`timeline.mjs` defines all scene positions, expressions, dialogue and sound cue times. `app.js` renders that clock, builds the layered painted puppets from transparent sprite sheets, and handles controls. `audio.mjs` synthesizes sound and retries browser-blocked playback on interaction. Playback pauses when the tab is hidden; reduced-motion visitors get the final birthday scene. Static birthday content remains available without JavaScript. `retro.html`, `retro.css` and `retro.js` preserve the earlier prototype.

All assets are local. The painted puppet sheets, scenery and wreckage are in `assets/`; SVG viewport clips isolate the puppet parts without changing the source images. The character prompt briefs are in `assets/puppet-prompts.md`.

## Checks

```sh
node --test tests/audio.test.mjs tests/timeline.test.mjs
node --check app.js
```

Tests cover act boundaries, the last words preceding the foreman, persistent fallen scenery, construction order, phone-size calculations and the silence around the final wish.

## GitHub Pages

Configure GitHub Pages to deploy from the root of the `main` branch, then push the chosen version. All runtime assets use relative paths; there is no build step or backend. The retro query remains a review link to the preserved prototype.
