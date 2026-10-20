'use strict';
/* Benchmark of next-press predictors on simulated human sequence generators.
   Run: node test/oracle-bench.js   (prints mean hits per 100 presses) */
const M = require('../js/mind/oracle-model.js');

const R = Math.random;
const flip = p => (R() < p ? 1 : 0);

// Each generator: () => step(history, hits) -> next key. `hits` is the predictor's
// record so far, which a player only sees in round 2.
const GENERATORS = {
  coin: () => () => flip(0.5),
  // Over-alternation with run avoidance (classic finding).
  alternator: () => s => {
    const n = s.length; if (!n) return flip(0.5);
    let run = 1; while (run < n && s[n - 1 - run] === s[n - 1]) run++;
    return R() < (run >= 3 ? 0.9 : 0.6) ? 1 - s[n - 1] : s[n - 1];
  },
  // Mild over-alternation only (a careful player).
  mild: () => s => (s.length ? (R() < 0.56 ? 1 - s[s.length - 1] : s[s.length - 1]) : flip(0.5)),
  // Balance seeking: leans toward whichever key was used less in the last 10.
  balancer: () => s => {
    const w = s.slice(-10), d = w.filter(Boolean).length - w.length / 2;
    return flip(0.5 - 0.09 * d);
  },
  // Repeats favourite chunks with noise ("FFJ", "JFJJ", ...), switching chunk at random.
  chunker: () => {
    const chunks = [[0, 0, 1], [1, 0, 1, 1], [0, 1, 0], [1, 1, 0, 1, 0]];
    let cur = [];
    return () => { if (!cur.length) cur = chunks[Math.floor(R() * chunks.length)].slice(); const x = cur.shift(); return R() < 0.15 ? 1 - x : x; };
  },
  // Mouse-like: switching costs a hand movement, so repeats are a bit more common,
  // and the player changes policy every ~30 presses.
  drifter: () => {
    let pSw = 0.4, left = 30;
    return s => { if (--left <= 0) { pSw = 0.3 + R() * 0.4; left = 20 + R() * 20; }
      return s.length ? (R() < pSw ? 1 - s[s.length - 1] : s[s.length - 1]) : flip(0.5); };
  },
  // Round-2 player who reacts to being caught: after a hit, switches; after a miss, repeats.
  reactive: () => (s, h) => {
    if (!s.length) return flip(0.5);
    const last = s[s.length - 1], caught = h[h.length - 1];
    return R() < 0.7 ? (caught ? 1 - last : last) : flip(0.5);
  },
};

function score(make, gen, n = 100, reps = 600) {
  let total = 0;
  for (let r = 0; r < reps; r++) {
    const o = make(), step = gen(), s = [], h = [];
    for (let i = 0; i < n; i++) {
      const g = o.predict(), x = step(s, h);
      h.push(g === x); s.push(x); o.update(x);
      total += g === x;
    }
  }
  return total / reps;
}

if (require.main !== module) { module.exports = { GENERATORS, score }; return; }

const models = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(M.MODELS);
const rows = [['generator', ...models]];
for (const g in GENERATORS) rows.push([g, ...models.map(m => score(M.MODELS[m], GENERATORS[g]).toFixed(1))]);
for (const r of rows) console.log(r.map((c, i) => String(c).padEnd(i ? 12 : 12)).join(''));
