// Synthetic drum tracks with a known tempo, meter and swing, shared by the tests and docs figures.
const SR = 11025;
function track(sections, sr = SR) {
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
  let T = 0.4; const truth = [], evs = [];
  for (const s of sections) {
    const b = 60 / s.bpm;
    for (let i = 0; i < s.beats; i++) {
      const t = T + i * b, pos = i % s.meter; truth.push({ t, down: pos === 0 });
      if (s.pad) { if (pos === 0) evs.push([t, 'pad', b * s.meter]); continue; }
      evs.push([t, pos === 0 ? 'kick' : (pos === Math.floor(s.meter / 2) || (s.meter === 3 && pos === 2) ? 'snare' : 'snareL')]);
      if (s.meter === 5 && pos === 3) evs.push([t, 'kick']);
      const off = s.swing ? b * 2 / 3 : b / 2; evs.push([t + off, 'hat']);
      if (!s.swing) { evs.push([t + b / 4, 'hatS']); evs.push([t + 3 * b / 4, 'hatS']); }
    }
    T += s.beats * b;
  }
  const x = new Float32Array(Math.ceil((T + 1) * sr));
  const add = (t, fn, len) => { const s0 = Math.floor(t * sr); for (let i = 0; i < len * sr && s0 + i < x.length; i++) x[s0 + i] += fn(i / sr); };
  for (const [t, k, len] of evs) {
    if (k === 'kick') add(t, u => Math.sin(2 * Math.PI * (50 + 100 * Math.exp(-u * 30)) * u) * Math.exp(-u * 12) * 0.9, 0.3);
    if (k === 'snare') add(t, u => rnd() * 0.45 * Math.exp(-u * 25), 0.2);
    if (k === 'snareL') add(t, u => rnd() * 0.2 * Math.exp(-u * 30) + 0.2 * Math.sin(2 * Math.PI * 90 * u) * Math.exp(-u * 20), 0.2);
    if (k === 'hat') add(t, u => rnd() * 0.12 * Math.exp(-u * 60), 0.05);
    if (k === 'hatS') add(t, u => rnd() * 0.05 * Math.exp(-u * 70), 0.04);
    if (k === 'pad') add(t, u => 0.25 * (Math.sin(2 * Math.PI * 220 * u) + 0.5 * Math.sin(2 * Math.PI * 277 * u)) * Math.min(1, u * 8), len);
  }
  return { x, truth, T, sr, evs };
}
module.exports = { track, SR };
