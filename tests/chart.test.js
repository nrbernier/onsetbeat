// Chart generation and layout checks.  Run: node --test tests/
const test = require('node:test'), assert = require('node:assert/strict');
const { loadCore } = require('./core'), { track } = require('./synth');
const C = loadCore();

const SONG = [{ bpm: 120, beats: 32, meter: 4 }, { bpm: 120, beats: 16, meter: 4, pad: true }, { bpm: 140, beats: 96, meter: 4 }];
const { x, sr } = track(SONG);
const raw = C.analyzeAudio(x, sr);
const fresh = () => C.prepareAnalysis({ ...raw, name: 'chart-test' }); // a new prepared copy each time
const an = fresh();
const KEYS = Object.keys(C.DIFFS);

for (const key of KEYS) {
  for (const aspect of [0.6, 1.6]) {
    test(`${key} at aspect ${aspect}: sane density, order and timing`, () => {
      const m = C.generateMap(an, key, aspect), D = m.D, o = m.objs;
      assert.ok(o.length > 20, `${o.length} markers`);
      for (let i = 1; i < o.length; i++) assert.ok(o[i].t >= (o[i - 1].end || o[i - 1].t) - 1e-6, `marker ${i} starts before the previous one ends`);
      const perSec = o.length / an.duration;
      assert.ok(perSec <= D.perSec * 1.05, `${perSec.toFixed(2)} markers/s over the limit ${D.perSec}`);
      for (const s of o.filter(z => z.type === 'slider')) {
        const speed = s.len / s.span;
        assert.ok(speed > 0.6 * D.vel && speed < 1.5 * D.vel, `phrase speed ${speed.toFixed(2)} vs target ${D.vel}`);
      }
      for (const p of o) {
        const pts = p.type === 'slider' ? p.pts : [p];
        for (const q of pts) assert.ok(q.x >= 0 && q.x <= m.fw && q.y >= 0 && q.y <= m.fh, 'marker outside the field');
      }
    });

    test(`${key} at aspect ${aspect}: markers on screen together do not overlap`, () => {
      const m = C.generateMap(an, key, aspect), D = m.D, r = D.r;
      const objs = m.objs.filter(o => o.type !== 'spinner');
      const shape = o => o.type === 'slider' ? o.pts.filter((p, i) => i % 3 === 0 || i === o.pts.length - 1) : [o];
      let pairs = 0, worst = Infinity;
      for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
        const a = objs[i], b = objs[j];
        if (b.t - D.ar > (a.end || a.t) + 0.3) break; // b appears after a is gone
        pairs++;
        for (const p of shape(a)) for (const q of shape(b)) worst = Math.min(worst, Math.hypot(p.x - q.x, p.y - q.y) / r);
      }
      assert.ok(pairs > 0);
      assert.ok(worst >= 2.0, `closest pair ${worst.toFixed(2)} radii apart (${pairs} pairs)`);
    });
  }
  test(`${key}: the same song always gives the same chart`, () => {
    const a = C.generateMap(fresh(), key, 0.6).objs, b = C.generateMap(fresh(), key, 0.6).objs;
    assert.deepEqual(a.map(o => [o.type, o.t, o.x, o.y]), b.map(o => [o.type, o.t, o.x, o.y]));
  });
}
