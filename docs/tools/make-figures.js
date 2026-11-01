// Generates the SVG illustrations for docs/analysis.md from the real analysis code.
// Run from the repo root:  node docs/tools/make-figures.js
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
let core = html.slice(html.indexOf('/*CORE-START*/'), html.indexOf('/*CORE-END*/'));
// expose intermediate results of the analysis for the figures
core = core.replace('  if (report) report(1);\n  return { hopT,', '  globalThis.__dbg = { emis, wPath, nW, NL, minL, hopT, winF, hopW, nov, mEm, MS, mOf, sub };\n  if (report) report(1);\n  return { hopT,');
const C = new Function(core + '\nreturn { analyzeAudio, prepareAnalysis, generateMap, sliderPosAt, DIFFS };')();
const OUT = path.join(__dirname, '../img/');
fs.mkdirSync(OUT, { recursive: true });
const sr = 11025;
const P = { bg: '#16132b', panel: '#1f1b3b', line: '#3a3466', fg: '#f2f0ff', muted: '#aba6d4', gold: '#ffc94a', red: '#ff5a76', sky: '#4cc6ff', mint: '#5fe3a9' };
const F = 'font-family="Helvetica, Arial, sans-serif"';
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n<rect width="${w}" height="${h}" rx="14" fill="${P.bg}"/>\n${body}\n</svg>\n`;
const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" ${F} font-size="${o.size || 13}" fill="${o.fill || P.fg}" text-anchor="${o.anchor || 'start'}"${o.weight ? ` font-weight="${o.weight}"` : ''}>${s}</text>`;
const f1 = v => (Math.round(v * 10) / 10).toString();

// ---- synthetic test tracks (same generator as the test suite) ----
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
function track(sections, extra) {
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
  return { x, truth, T };
}
function analyse(name, secs) { const { x, truth } = track(secs); const an = C.analyzeAudio(x, sr); const dbg = globalThis.__dbg; an.name = name; C.prepareAnalysis(an); return { an, dbg, truth }; }

// ===== Figure 1: pipeline =====
{
  const W = 860, H = 300;
  const box = (x, y, w, h, title, sub, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${P.panel}" stroke="${col}" stroke-width="2"/>` + txt(x + w / 2, y + 24, title, { anchor: 'middle', weight: 700, size: 14 }) + sub.map((l, i) => txt(x + w / 2, y + 44 + i * 16, l, { anchor: 'middle', size: 11.5, fill: P.muted })).join('');
  const arr = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${P.muted}" stroke-width="2" marker-end="url(#a)"/>`;
  let b = `<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="${P.muted}"/></marker></defs>`;
  b += txt(24, 32, 'From audio file to chart', { size: 17, weight: 700 });
  b += box(24, 56, 150, 84, 'Audio', ['mono, 11 kHz', '46 ms frames', 'every 11.6 ms'], P.muted);
  b += box(214, 56, 170, 84, 'Spectral flux', ['40 mel bands', 'rise in loudness', 'per band, summed'], P.sky);
  b += box(424, 56, 170, 84, 'Onsets', ['local peaks above', 'a moving threshold'], P.red);
  b += box(214, 186, 170, 90, 'Tempo path', ['8 s autocorrelation', 'windows, joined by', 'Viterbi'], P.gold);
  b += box(424, 186, 170, 90, 'Beats', ['dynamic programming', 'using the local', 'tempo'], P.gold);
  b += box(634, 186, 200, 90, 'Grid and bars', ['each beat in 4 or 3', 'meter 3, 4, 5 or 7', 'per section'], P.mint);
  b += box(634, 56, 200, 84, 'Chart', ['pick strongest grid', 'points → tap, phrase,', 'spin → place on field'], P.gold);
  b += arr(174, 98, 212, 98) + arr(384, 98, 422, 98) + arr(299, 140, 299, 184) + arr(384, 231, 422, 231) + arr(594, 231, 632, 231) + arr(594, 98, 632, 98) + arr(734, 186, 734, 142);
  fs.writeFileSync(OUT + '1-pipeline.svg', svg(W, H, b));
}

// ===== Figure 2: onset detection + beats on a 4/4 track =====
{
  const { an } = analyse('fig2', [{ bpm: 120, beats: 32, meter: 4 }]);
  const t0 = 2.0, t1 = 6.0, W = 860, H = 320, L = 50, R = 830, top = 60, bot = 220;
  const X = t => L + (t - t0) / (t1 - t0) * (R - L), Y = v => bot - Math.min(1.3, v) / 1.3 * (bot - top);
  let b = txt(24, 32, 'Onset strength, detected onsets and tracked beats', { size: 17, weight: 700 });
  // threshold (local mean + 0.07)
  const n = an.env.length, f0 = an.frameOf(t0), f1 = an.frameOf(t1);
  let thr = '', crv = `M${X(an.off + f0 * an.hopT)} ${bot}`;
  for (let f = f0; f <= f1; f++) {
    let s = 0; const a = Math.max(0, f - 12), c = Math.min(n, f + 7); for (let j = a; j < c; j++) s += an.env[j];
    const t = an.off + f * an.hopT; thr += (f === f0 ? 'M' : 'L') + f1x(X(t)) + ' ' + f1x(Y(s / (c - a) + 0.07)) + ' ';
    crv += ` L${f1x(X(t))} ${f1x(Y(an.env[f]))}`;
  }
  function f1x(v) { return Math.round(v * 10) / 10; }
  crv += ` L${X(an.off + f1 * an.hopT)} ${bot} Z`;
  // beats
  an.beats.forEach((t, i) => { if (t < t0 || t > t1) return; const down = an.barPos[i] === 0;
    b += `<line x1="${X(t)}" y1="${top - 14}" x2="${X(t)}" y2="${bot + 34}" stroke="${down ? P.gold : P.fg}" stroke-opacity="${down ? 0.8 : 0.3}" stroke-width="${down ? 2 : 1}"/>`;
    if (down) b += txt(X(t) + 4, top - 2, 'bar ' + (an.barIdx[i] + 1), { size: 11, fill: P.gold }); });
  b += `<path d="${crv}" fill="${P.muted}" fill-opacity="0.25" stroke="${P.muted}" stroke-width="1.2"/>`;
  b += `<path d="${thr}" fill="none" stroke="${P.sky}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  for (const o of an.onsets) if (o.t >= t0 && o.t <= t1) b += `<circle cx="${f1x(X(o.t))}" cy="${f1x(Y(o.s))}" r="4.5" fill="${P.red}"/>`;
  b += `<line x1="${L}" y1="${bot}" x2="${R}" y2="${bot}" stroke="${P.line}"/>`;
  for (let t = Math.ceil(t0); t <= t1; t++) b += txt(X(t), bot + 50, t + ' s', { size: 11, fill: P.muted, anchor: 'middle' });
  // legend
  const lg = [[P.muted, 'onset strength (spectral flux)'], [P.sky, 'threshold: local mean + 0.07'], [P.red, 'onset (local peak above it)'], [P.gold, 'tracked beat (gold = bar start)']];
  lg.forEach(([c, s], i) => { const x = 50 + i * 200; b += `<rect x="${x}" y="${H - 24}" width="14" height="8" rx="2" fill="${c}"/>` + txt(x + 20, H - 16, s, { size: 11.5, fill: P.muted }); });
  fs.writeFileSync(OUT + '2-onsets-beats.svg', svg(W, H, b));
}

// ===== Figure 3: tempo path (tempogram + Viterbi) on a 95 → 140 bpm track =====
{
  const { an, dbg } = analyse('fig3', [{ bpm: 95, beats: 64, meter: 4 }, { bpm: 140, beats: 96, meter: 4 }]);
  const { emis, wPath, nW, NL, minL, hopT, winF, hopW } = dbg;
  const W = 860, H = 360, L = 60, R = 830, top = 74, bot = 300;
  const bpmOf = j => 60 / ((minL + j) * hopT);
  const yB = bpm => bot - (Math.log2(bpm) - Math.log2(50)) / (Math.log2(210) - Math.log2(50)) * (bot - top);
  const tW = w => (w * hopW + winF / 2) * hopT, dur = an.duration;
  const X = t => L + t / dur * (R - L);
  let b = txt(24, 32, 'Tempo over time: windowed autocorrelation (shading) and the chosen path', { size: 17, weight: 700 });
  const cw = (R - L) / nW + 0.6;
  for (let w = 0; w < nW; w += 1) for (let j = 0; j < NL; j++) {
    const v = emis[w * NL + j]; if (v < 0.25) continue;
    const y0 = yB(bpmOf(j)), y1 = yB(bpmOf(j + 1));
    b += `<rect x="${(X(tW(w)) - cw / 2).toFixed(1)}" y="${Math.min(y0, y1).toFixed(1)}" width="${cw.toFixed(1)}" height="${Math.abs(y0 - y1).toFixed(1) || 1}" fill="${P.sky}" fill-opacity="${(0.08 + 0.6 * (v - 0.25) / 0.75).toFixed(2)}"/>`;
  }
  let path = '';
  for (let w = 0; w < nW; w++) path += (w ? 'L' : 'M') + X(tW(w)).toFixed(1) + ' ' + yB(bpmOf(wPath[w])).toFixed(1) + ' ';
  b += `<path d="${path}" fill="none" stroke="${P.gold}" stroke-width="3"/>`;
  for (const bpm of [60, 80, 100, 120, 140, 180]) b += `<line x1="${L}" x2="${R}" y1="${yB(bpm)}" y2="${yB(bpm)}" stroke="${P.line}" stroke-dasharray="2 4"/>` + txt(L - 8, yB(bpm) + 4, bpm, { size: 11, fill: P.muted, anchor: 'end' });
  b += txt(L - 8, top - 10, 'bpm', { size: 11, fill: P.muted, anchor: 'end' });
  for (let t = 0; t <= dur; t += 10) b += txt(X(t), bot + 18, t + ' s', { size: 11, fill: P.muted, anchor: 'middle' });
  const tc = 64 * 60 / 95 + 0.4;
  b += `<line x1="${X(tc)}" x2="${X(tc)}" y1="${top}" y2="${bot}" stroke="${P.red}" stroke-dasharray="4 3"/>` + txt(X(tc) + 6, top + 12, 'real change 95 → 140', { size: 11, fill: P.red });
  b += txt(L, H - 14, 'Shading: how strongly the onsets repeat at each beat period in an 8 s window. Gold: the Viterbi path, which only switches when the evidence lasts.', { size: 11.5, fill: P.muted });
  fs.writeFileSync(OUT + '3-tempo-path.svg', svg(W, H, b));
}

// ===== Figure 4: straight vs triplet subdivision =====
{
  const { an } = analyse('fig4', [{ bpm: 110, beats: 32, meter: 4, swing: true }]);
  const W = 860, H = 300;
  let b = txt(24, 32, 'Straight or triplet: which grid do the off-beat onsets sit on?', { size: 17, weight: 700 });
  const row = (y, label, fracs, col, onsets) => {
    const L = 200, R = 820, X = u => L + u * (R - L) / 2;
    let s = txt(24, y + 5, label, { size: 13, weight: 700 });
    s += `<line x1="${L}" x2="${R}" y1="${y}" y2="${y}" stroke="${P.line}" stroke-width="2"/>`;
    for (let k = 0; k <= 2; k++) s += `<line x1="${X(k)}" x2="${X(k)}" y1="${y - 26}" y2="${y + 26}" stroke="${P.fg}" stroke-opacity="0.5" stroke-width="2"/>`;
    for (let k = 0; k < 2; k++) for (const f of fracs) s += `<line x1="${X(k + f)}" x2="${X(k + f)}" y1="${y - 12}" y2="${y + 12}" stroke="${col}" stroke-width="3"/>`;
    for (const u of onsets) s += `<circle cx="${X(u)}" cy="${y - 34}" r="6" fill="${P.red}"/><line x1="${X(u)}" x2="${X(u)}" y1="${y - 28}" y2="${y - 14}" stroke="${P.red}" stroke-dasharray="2 2"/>`;
    return s;
  };
  b += row(110, 'Straight (÷4)', [0.25, 0.5, 0.75], P.fg, [0, 0.5, 1, 1.5]);
  b += txt(200, 152, 'Onsets land on 1/2: they fit the quarter grid exactly, the thirds miss by 1/6 of a beat.', { size: 12, fill: P.muted });
  b += row(220, 'Swing (÷3)', [1 / 3, 2 / 3], P.mint, [0, 2 / 3, 1, 1 + 2 / 3]);
  b += txt(200, 262, 'Onsets land on 2/3: thirds fit exactly, quarters miss by 1/12. Weighted by onset strength over ±3 beats.', { size: 12, fill: P.muted });
  const share = Math.round(an.sub.reduce((a, v) => a + (v === 3), 0) / an.sub.length * 100);
  b += txt(24, H - 14, `On a synthetic swing track, ${share}% of beats are given the triplet grid; on straight tracks, 0%.`, { size: 11.5, fill: P.muted });
  fs.writeFileSync(OUT + '4-swing-grid.svg', svg(W, H, b));
}

// ===== Figure 5: meter scores =====
{
  const cases = [['3/4 waltz', { bpm: 150, beats: 96, meter: 3 }], ['4/4 rock', { bpm: 120, beats: 96, meter: 4 }], ['5/4', { bpm: 130, beats: 100, meter: 5 }], ['7/4', { bpm: 140, beats: 112, meter: 7 }]];
  const W = 860, H = 320;
  let b = txt(24, 32, 'Meter: how well the beat pattern repeats after 3, 4, 5 or 7 beats', { size: 17, weight: 700 });
  const gw = 190, base = 250, sc = 120;
  cases.forEach(([name, sec], ci) => {
    const { dbg } = analyse('fig5' + ci, [sec]);
    const { mEm, MS } = dbg, nb = mEm.length / MS.length;
    const avg = MS.map((m, k) => { let s = 0; for (let i = 0; i < nb; i++) s += mEm[i * MS.length + k]; return s / nb; });
    const mx = Math.max(...avg), mn = Math.min(0, ...avg);
    const x0 = 50 + ci * (gw + 16);
    b += txt(x0 + gw / 2 - 10, 70, name, { anchor: 'middle', weight: 700, size: 14 });
    MS.forEach((m, k) => {
      const h = Math.max(2, (avg[k] - mn) / (mx - mn) * sc), x = x0 + k * 40, win = avg[k] === mx;
      b += `<rect x="${x}" y="${base - h}" width="30" height="${h}" rx="4" fill="${win ? P.gold : P.line}"/>` + txt(x + 15, base + 18, m, { anchor: 'middle', size: 12, fill: win ? P.gold : P.muted });
    });
  });
  b += txt(50, base + 44, 'Bars: average score per candidate bar length (beat-pattern similarity + accent correlation). Gold: chosen.', { size: 11.5, fill: P.muted });
  fs.writeFileSync(OUT + '5-meter-scores.svg', svg(W, H, b));
}

// ===== Figure 6: chart generation by difficulty =====
{
  const { an } = analyse('fig6', [{ bpm: 120, beats: 16, meter: 4 }, { bpm: 120, beats: 16, meter: 4, pad: true }, { bpm: 120, beats: 16, meter: 4 }]);
  const t0 = 6.4, t1 = 22.4, W = 860, H = 380, L = 110, R = 840;
  const X = t => L + (t - t0) / (t1 - t0) * (R - L);
  let b = txt(24, 32, 'From grid to chart: same song, four difficulties', { size: 17, weight: 700 });
  // grid strength row
  const gy = 80;
  b += txt(24, gy + 4, 'grid', { size: 12, fill: P.muted });
  for (const g of an.grid) { if (g.t < t0 || g.t > t1) continue; const r = g.s > 0 ? 2 + 5 * Math.min(1.4, g.s) / 1.4 : 1.2;
    b += `<circle cx="${X(g.t).toFixed(1)}" cy="${gy}" r="${r.toFixed(1)}" fill="${g.s > 0 ? P.red : P.line}" fill-opacity="${g.s > 0 ? 0.85 : 1}"/>`; }
  an.beats.forEach((t, i) => { if (t < t0 || t > t1 || an.barPos[i] !== 0) return; b += `<line x1="${X(t)}" x2="${X(t)}" y1="56" y2="${H - 56}" stroke="${P.fg}" stroke-opacity="0.15"/>`; });
  b += `<defs><clipPath id="c"><rect x="0" y="40" width="${R + 2}" height="${H - 80}"/></clipPath></defs><g clip-path="url(#c)">`;
  ['easy', 'normal', 'hard', 'insane'].forEach((k, ri) => {
    const y = 140 + ri * 52, m = C.generateMap(an, k, 0.6);
    b += txt(24, y + 4, k[0].toUpperCase() + k.slice(1), { size: 13, weight: 700 });
    for (const o of m.objs) {
      if ((o.end || o.t) < t0 || o.t > t1) continue;
      if (o.type === 'spinner') b += `<rect x="${X(o.t)}" y="${y - 13}" width="${X(o.end) - X(o.t)}" height="26" rx="8" fill="${P.red}" fill-opacity="0.35" stroke="${P.red}" stroke-width="2"/>` + txt(X(o.t) + 10, y + 5, 'SPIN', { size: 12, weight: 700 });
      else if (o.type === 'slider') b += `<line x1="${X(o.t)}" x2="${X(o.end)}" y1="${y}" y2="${y}" stroke="#fff" stroke-width="18" stroke-linecap="round"/><line x1="${X(o.t)}" x2="${X(o.end)}" y1="${y}" y2="${y}" stroke="#16385b" stroke-width="14" stroke-linecap="round"/>`;
    }
    for (const o of m.objs) { if (o.type === 'spinner' || o.t < t0 || o.t > t1) continue; b += `<circle cx="${X(o.t).toFixed(1)}" cy="${y}" r="7" fill="${o.type === 'slider' ? P.sky : P.gold}" stroke="#fff" stroke-width="1.5"/>`; }
  });
  b += '</g>';
  b += txt(X(12.4), 56, 'held chords, no drums', { size: 11, fill: P.muted, anchor: 'middle' });
  b += txt(24, H - 30, 'Top row: grid points (sixteenths), dot size = onset strength snapped there. Gold: tap. Blue: phrase (slider). Red: spin.', { size: 11.5, fill: P.muted });
  b += txt(24, H - 12, 'Lines: bar starts. Held sound after a note becomes a phrase; a long held stretch without new hits becomes a spin.', { size: 11.5, fill: P.muted });
  fs.writeFileSync(OUT + '6-chart-difficulties.svg', svg(W, H, b));
}

// ===== Figure 7: layout without overlap =====
{
  const { an } = analyse('fig7', [{ bpm: 140, beats: 64, meter: 4 }]);
  const m = C.generateMap(an, 'hard', 1.5), D = m.D;
  const objs = m.objs.filter(o => o.type !== 'spinner');
  // pick a moment and draw everything visible at that time
  const visAt = t => objs.filter(o => o.t - D.ar <= t && (o.end || o.t) + 0.25 >= t);
  let tNow = objs[0].t, best = -1;
  for (const o of objs) { const t = o.t - 0.05, v = visAt(t), sc = v.length + (v.some(z => z.type === 'slider') ? 2 : 0); if (sc > best) { best = sc; tNow = t; } }
  const vis = visAt(tNow);
  const W = 860, H = 480, S = 330, ox = 40 + (W - 80 - m.fw * S) / 2, oy = 70;
  const P2 = p => ({ x: ox + p.x * S, y: oy + p.y * S }), r = D.r * S;
  let b = txt(24, 32, 'Placement: every marker on screen at the same time keeps its distance', { size: 17, weight: 700 });
  b += `<rect x="${ox}" y="${oy}" width="${m.fw * S}" height="${m.fh * S}" rx="8" fill="${P.panel}" stroke="${P.line}"/>`;
  const cols = [P.red, P.gold, P.sky, P.mint], bodies = ['#4c1f36', '#4b3b18', '#16385b', '#174a3b'];
  for (const o of vis.slice().reverse()) {
    if (o.type === 'slider') { const d = o.pts.map((p, i) => (i ? 'L' : 'M') + P2(p).x.toFixed(1) + ' ' + P2(p).y.toFixed(1)).join(' ');
      b += `<path d="${d}" fill="none" stroke="#fff" stroke-width="${2 * r}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${bodies[o.col]}" stroke-width="${2 * r - 6}" stroke-linecap="round" stroke-linejoin="round"/>`; }
    const p = P2(o.type === 'slider' ? o.pts[0] : o);
    b += `<circle cx="${p.x}" cy="${p.y}" r="${r * 1.1}" fill="none" stroke="${P.fg}" stroke-opacity="0.35" stroke-dasharray="3 4"/>`;
    b += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${cols[o.col]}" stroke="#fff" stroke-width="3"/>` + txt(p.x, p.y + 5, o.num, { anchor: 'middle', size: 15, weight: 700 });
    const k = Math.max(0, (o.t - tNow) / D.ar); if (k > 0) b += `<circle cx="${p.x}" cy="${p.y}" r="${r * (1.02 + 2.3 * k)}" fill="none" stroke="${cols[o.col]}" stroke-width="2.5"/>`;
  }
  b += txt(24, H - 30, `Snapshot of a Hard chart at 140 bpm: all ${vis.length} markers visible at that moment. Dashed ring: the keep-out zone (2.2 radii between centres,`, { size: 11.5, fill: P.muted });
  b += txt(24, H - 12, 'measured against circles and every point along phrase tracks). Crowded spots search the whole field; a phrase with no clear path becomes a tap.', { size: 11.5, fill: P.muted });
  fs.writeFileSync(OUT + '7-layout.svg', svg(W, H, b));
}
console.log(fs.readdirSync(OUT).join(' '));
