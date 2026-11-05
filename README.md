# Silvio XXXIII

A theatrical birthday miracle, currently under construction. Jesus and Silvio celebrate turning 33 together, until the stage falls apart. Buried in the scenery, Jesus gives Silvio a final birthday wish before a construction foreman arrives to install the under-construction sign. Two browser-only prototypes share the same animated story:

- Sacred Cinema: `/?theme=cinema`
- Cursed Retro Internet: `/?theme=retro`

## Preview locally

From this directory run:

```sh
python -m http.server 8765
```

Open `http://localhost:8765/?theme=cinema` or `http://localhost:8765/?theme=retro`. Sound starts off. Use **Skip intro** to see the ending and **Replay the miracle** to start over.

The scene, text, timings, and default theme are defined in `app.js`. The original layered artwork also lives in `assets/`; the SVGs are embedded in `index.html` so the characters can be animated. The illustrated theater backdrop and transparent wreckage are stored locally in `assets/`.

## GitHub Pages

After choosing a prototype, set its theme as the default in `app.js` and remove the review-only query-string selector. Configure GitHub Pages to deploy from the root of the `main` branch, then push the chosen version. All runtime assets are local and use relative paths; there is no build step or backend.
