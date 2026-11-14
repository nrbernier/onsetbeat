# To do

## Features

- [ ] **Manual beat fixes.** Add ×2 / ÷2 tempo and "shift downbeat" buttons on the analysis card, saved with the cached analysis (keyed by fingerprint), so a wrong tempo octave or downbeat can be corrected.
- [ ] **Real offline support.** Self-host the fonts (Dela Gothic One, IBM Plex Mono, Zen Kaku Gothic New) instead of loading them from Google Fonts, and add a service worker that caches the page, manifest, icons and fonts so the installed app opens without a network.
- [ ] **Use kick/hat data in charts.** Each onset already carries low- and high-band strength (`lo`, `hi`), but chart generation ignores it. Let kick, snare and hat drive placement patterns, so a repeated rhythm gives a repeated shape.
- [ ] **Follow lines.** Draw lines between consecutive markers in a combo, as in Ouendan. Maybe with a Settings toggle.
- [ ] **Count-in after pause.** Resume is instant; add a short count-in or a two-second rewind.

## Smaller fixes

- [ ] **Spinner.** `sp.acc += Math.abs(d)` counts back-and-forth wiggling as rotation. Accumulate the signed angle instead.
- [ ] **Chart seed.** The seed uses the file name, so a renamed file gets a different chart even though the cache recognises it. Seed from the fingerprint.
- [ ] **Wake lock.** It isn't re-requested after returning from the background, so the screen can dim mid-song.
- [ ] **Render loop.** The `requestAnimationFrame` loop keeps running after leaving the game. Cancel it on quit.
- [ ] **Manifest.** Split `"any maskable"` into separate icon entries.
- [ ] **README.** Add the live link, a screenshot or GIF, and a LICENSE.
- [ ] **Tests.** Turn the synthetic tracks behind the docs figures into CI checks (tempo, meter, swing, no marker overlap), so analysis regressions get caught.
