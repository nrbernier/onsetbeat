// Analysis checks on synthetic tracks with a known answer.  Run: node --test tests/
const test = require('node:test'), assert = require('node:assert/strict');
const { loadCore } = require('./core'), { track } = require('./synth');
const C = loadCore();

const cache = new Map();
function analyse(name, sections) {
  if (!cache.has(name)) {
    const { x, truth, sr } = track(sections);
    cache.set(name, { an: C.prepareAnalysis(Object.assign(C.analyzeAudio(x, sr), { name })), truth });
  }
  return cache.get(name);
}
const near = (t, arr, tol) => arr.some(b => Math.abs(b - t) < tol);
const beatAcc = ({ an, truth }) => truth.filter(b => near(b.t, an.beats, 0.05)).length / truth.length;
function downAcc({ an, truth }) {
  const downs = an.beats.filter((b, i) => an.barPos[i] === 0), td = truth.filter(b => b.down).map(b => b.t);
  return downs.filter(d => near(d, td, 0.05)).length / downs.length;
}
const dominant = an => an.meterList[0];

const CASES = [
  ['4/4 at 120 bpm', [{ bpm: 120, beats: 96, meter: 4 }], { bpm: 120, meter: 4, down: 0.85 }],
  ['3/4 waltz at 150 bpm', [{ bpm: 150, beats: 96, meter: 3 }], { bpm: 150, meter: 3, down: 0.85 }],
  ['5/4 at 130 bpm', [{ bpm: 130, beats: 100, meter: 5 }], { bpm: 130, meter: 5 }], // bar start known to be ambiguous
  ['7/4 at 140 bpm', [{ bpm: 140, beats: 112, meter: 7 }], { bpm: 140, meter: 7, down: 0.85 }],
  ['swing at 110 bpm', [{ bpm: 110, beats: 64, meter: 4, swing: true }], { bpm: 110, meter: 4, down: 0.8, swing: true }],
];

for (const [name, secs, want] of CASES) {
  test(name, () => {
    const r = analyse(name, secs);
    assert.ok(Math.abs(r.an.bpm / want.bpm - 1) < 0.03, `tempo ${r.an.bpm.toFixed(1)} vs ${want.bpm}`);
    assert.ok(beatAcc(r) >= 0.95, `beats within 50 ms: ${beatAcc(r).toFixed(2)}`);
    assert.equal(dominant(r.an), want.meter, 'meter');
    if (want.down) assert.ok(downAcc(r) >= want.down, `bar starts on true downbeats: ${downAcc(r).toFixed(2)}`);
    if (want.swing) assert.ok(r.an.swingShare > 0.7, `swing share ${r.an.swingShare.toFixed(2)}`);
    else assert.ok(r.an.swingShare < 0.1, `swing share ${r.an.swingShare.toFixed(2)}`);
  });
}

test('tempo change 95 → 140 bpm is followed', () => {
  const r = analyse('change', [{ bpm: 95, beats: 64, meter: 4 }, { bpm: 140, beats: 96, meter: 4 }]);
  assert.ok(Math.abs(r.an.bpmLo - 95) < 4 && Math.abs(r.an.bpmHi - 140) < 4, `range ${r.an.bpmLo.toFixed(0)}–${r.an.bpmHi.toFixed(0)}`);
  assert.ok(beatAcc(r) >= 0.95, `beats within 50 ms: ${beatAcc(r).toFixed(2)}`);
});

test('meter change 4/4 → 5/4 → 4/4 is found within two bars', () => {
  const r = analyse('meters', [{ bpm: 120, beats: 48, meter: 4 }, { bpm: 120, beats: 50, meter: 5 }, { bpm: 120, beats: 48, meter: 4 }]);
  const ms = r.an.meters.map(m => m.m);
  assert.deepEqual(ms, [4, 5, 4]);
  const b5 = r.an.meters[1].beat, b4 = r.an.meters[2].beat;
  assert.ok(Math.abs(b5 - 48) <= 8 && Math.abs(b4 - 98) <= 8, `changes at beats ${b5} and ${b4}`);
});
