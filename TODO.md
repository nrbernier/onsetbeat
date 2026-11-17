# To do

## Features

- [x] **Manual beat fixes.** Add ×2 / ÷2 tempo and "shift downbeat" buttons on the analysis card, saved with the cached analysis (keyed by fingerprint), so a wrong tempo octave or downbeat can be corrected.
- [x] **Real offline support.** Self-host the fonts (Dela Gothic One, IBM Plex Mono, Zen Kaku Gothic New) instead of loading them from Google Fonts, and add a service worker that caches the page, manifest, icons and fonts so the installed app opens without a network.
- [x] **Use kick/hat data in charts.** Each onset already carries low- and high-band strength (`lo`, `hi`), but chart generation ignores it. Let kick, snare and hat drive placement patterns, so a repeated rhythm gives a repeated shape.
- [x] **Follow lines.** Draw lines between consecutive markers in a combo, as in Ouendan. Maybe with a Settings toggle.
- [x] **Count-in after pause.** Resume is instant; add a short count-in or a two-second rewind.

## Smaller fixes

- [x] **Spinner.** `sp.acc += Math.abs(d)` counts back-and-forth wiggling as rotation. Accumulate the signed angle instead.
- [x] **Chart seed.** The seed uses the file name, so a renamed file gets a different chart even though the cache recognises it. Seed from the fingerprint.
- [x] **Wake lock.** It isn't re-requested after returning from the background, so the screen can dim mid-song.
- [x] **Render loop.** The `requestAnimationFrame` loop keeps running after leaving the game. Cancel it on quit.
- [x] **Manifest.** Split `"any maskable"` into separate icon entries.
- [x] **README.** Add the live link, a screenshot or GIF, and a LICENSE.
- [x] **Tests.** Turn the synthetic tracks behind the docs figures into CI checks (tempo, meter, swing, no marker overlap), so analysis regressions get caught.

## Follow-ups

- [ ] **Downbeats after a tempo change.** On a synthetic track that jumps from 95 to 140 bpm, only 39% of bar starts land on true downbeats: the bar phase is chosen once per meter section, so it slips at the change. Pick the downbeat phase per stretch (or with a Viterbi pass) instead. Until then, "Bar ◀ / ▶" can correct it by hand.
- [ ] **5/4 bar start.** With kicks on 1 and 4, the bar start lands on 4 (known limit, see docs/analysis.md).
