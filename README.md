# Onsetbeat

A mobile rhythm game in the spirit of Osu! Tatakae! Ouendan, played on charts generated from your own music.

Pick an audio file and Onsetbeat analyses it entirely in the browser:

1. **Onsets**: spectral flux over ~40 mel bands, with adaptive peak picking.
2. **Tempo and beats**: autocorrelation of the onset novelty, then dynamic-programming beat tracking (Ellis 2007). The bar's first beat is the beat position with the most low-end energy.
3. **Chart**: onsets are snapped to a sixteenth-note grid and the strongest are kept per difficulty (Easy: beats only … Insane: sixteenths).
4. **Markers**: sustained sound after a note becomes a **phrase** (slider, sometimes with reverses), a long loud stretch without hits becomes a **spin**, everything else is a **tap**.

The close-up view shows onset strength, the beat grid and the generated chart, and "Hear the chart" plays the song with a click on every marker.

No build step and no dependencies: `index.html` is the whole app, so it runs as is on GitHub Pages. Audio files never leave the device.
