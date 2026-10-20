'use strict';
/* For Your Eyes Only checks. Run: node test/yours.test.js */
const assert = require('node:assert');
const { FY, FY_WORDS, fyEncode, fyDecode, fyPair, fyFlash, fyEstimate, fyCellPairs, fyCells, fyLevel,
  fyContrast, fySeparability, fyWord } = require('../js/eye/yours-model.js');

let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

for (let v = 0; v <= 1; v += 0.01) assert.ok(close(fyEncode(fyDecode(v)), v, 1e-9));

// Every k the calibration can reach, every amplitude pair either mode uses: inside the
// gamut, mean exactly M, and no WCAG flash (general or red) for the standard observer.
const ks = [];
for (let i = 0; i <= 40; i++) ks.push(FY.K_MIN * (FY.K_MAX / FY.K_MIN) ** (i / 40));
const amps = [[1, 1], ...fyCellPairs().map(([a, b]) => [fyLevel(a), fyLevel(b)])];
let worstY = 0, worstRed = 0;
for (const k of ks) for (const [sa, sb] of amps) {
  const { A, B } = fyPair(k, sa, sb);
  for (const c of [A, B]) for (const v of c) assert.ok(v >= 0 && v <= 1, `gamut k=${k} ${sa} ${sb}`);
  for (let i = 0; i < 3; i++) assert.ok(close((A[i] + B[i]) / 2, FY.M[i]));
  const f = fyFlash(A, B);
  assert.ok(!f.general && !f.red, `flash k=${k.toFixed(3)} sa=${sa} sb=${sb}: ${JSON.stringify(f)}`);
  worstY = Math.max(worstY, f.dY);
  worstRed = Math.max(worstRed, f.redMax);
}
assert.ok(worstY < 0.1 && worstRed < 0.8);
assert.ok(FY.STD_K > FY.K_MIN && FY.STD_K < FY.K_MAX);

// Null: the key's own observer sees no flicker; others see flicker growing with the gap.
assert.ok(close(fyContrast(FY.STD_K, FY.STD_K), 0));
assert.ok(fyContrast(FY.STD_K * 1.05, FY.STD_K) < fyContrast(FY.STD_K * 1.1, FY.STD_K));
assert.ok(close(fyContrast(0.3, 0.3, fyLevel(4), fyLevel(4)), 0));

// Calibration estimate.
{
  const e = fyEstimate([-0.5, -0.52, -0.48, -0.51, -0.49, -0.5].map(x => x));
  assert.ok(close(e.k, 10 ** -0.5, 1e-12));
  assert.ok(e.sd > 0.01 && e.sd < 0.02 && e.pct > 2 && e.pct < 5);
  assert.ok(close(fyEstimate([-0.4, -0.6]).k, 10 ** -0.5, 1e-12));
}

// Cells: letters at a = b, background at an allowed offset; a and b distributed alike
// inside and outside, so neither colour channel of a single frame marks the letters.
{
  const N = 200000;
  const mask = Array.from({ length: N }, () => (rand() < 0.3 ? 1 : 0));
  const cells = fyCells(mask, rand);
  const hist = () => ({ a: new Array(FY.LEVELS).fill(0), b: new Array(FY.LEVELS).fill(0), n: 0, up: 0 });
  const ins = hist(), out = hist();
  cells.forEach((c, i) => {
    const h = mask[i] ? ins : out;
    h.a[c.a]++; h.b[c.b]++; h.n++; h.up += c.phase > 0;
    if (mask[i]) assert.strictEqual(c.a, c.b);
    else assert.ok(FY.OFFSETS.includes(Math.abs(c.a - c.b)));
  });
  for (const ch of ['a', 'b']) for (let j = 0; j < FY.LEVELS; j++) {
    const d = Math.abs(ins[ch][j] / ins.n - out[ch][j] / out.n);
    assert.ok(d < 0.006, `${ch}[${j}] differs by ${d.toFixed(4)}`);
  }
  for (const h of [ins, out]) assert.ok(Math.abs(h.up / h.n - 0.5) < 0.01);
}

// Simulated observers in the cells mode: the key's owner separates the letters perfectly,
// people within the setting noise nearly so, people 10% or more away at most weakly.
{
  const mask = Array.from({ length: 30000 }, () => (rand() < 0.3 ? 1 : 0));
  const cells = fyCells(mask, rand);
  const k = FY.STD_K;
  const curve = [];
  for (const e of [0, 0.01, 0.02, 0.04, 0.07, 0.1, 0.15, 0.2, 0.3]) {
    const up = fySeparability(cells, mask, k * (1 + e), k);
    const down = fySeparability(cells, mask, k / (1 + e), k);
    curve.push(`${(e * 100).toFixed(0)}%: ${up.toFixed(2)}/${down.toFixed(2)}`);
    if (e === 0) assert.strictEqual(up, 1);
    if (e <= 0.02) assert.ok(up > 0.95 && down > 0.95, `e=${e}`);
    if (e >= 0.1) assert.ok(up < 0.2 && down < 0.2, `e=${e}: ${up} ${down}`);
  }
  console.log('separability (owner + gap above/below):', curve.join('  '));
  console.log(`uniform mode, letters' flicker for someone 5% / 10% / 20% away: ${[0.05, 0.1, 0.2]
    .map(e => (fyContrast(k * (1 + e), k) * 100).toFixed(1) + '%').join(' / ')}`);
}

// Words.
{
  const used = FY_WORDS.slice(0, FY_WORDS.length - 1);
  assert.strictEqual(fyWord(used, rand), FY_WORDS[FY_WORDS.length - 1]);
}

console.log(`yours: ok (worst ΔY ${worstY.toFixed(3)}, worst red ratio ${worstRed.toFixed(3)})`);
