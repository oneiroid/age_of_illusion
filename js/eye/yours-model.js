'use strict';

/* For Your Eyes Only: colours, calibration estimate, cell layout and simulated
   observers. Pure logic, no DOM: loaded by index.html and by test/yours.test.js.

   Two frames alternate: A = M + d, B = M − d, with d = c · R · (sa, −k · sb, 0) in
   linear light. Their time average is M whatever k is. An observer whose luminance
   weights red and green as w_r : w_g sees no luminance flicker when w_r · sa = w_g · k · sb,
   so with sa = sb the flicker vanishes at k = w_r / w_g: that observer's null point.
   Red swings over the whole range and there is no blue, so the luminance flicker that
   everyone else sees is as large as the screen allows. */

const FY = {
  R: 0.5,                     // red mean and half-amplitude: red runs 0 ↔ 1
  FLOOR: 0.004,               // green stays just above 0, so dithering isn't clipped
  STD_K: 0.2126 / 0.7152,     // the sRGB (CIE 1924) observer's null
  K_MIN: 0.10, K_MAX: 0.90,   // calibration range
  LEVELS: 10, Q: 0.92,        // amplitude levels of the cells mode: Q^j, j < LEVELS
  OFFSETS: [1, 2],            // |a − b| of background cells, in levels
};

const fyEncode = x => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
const fyDecode = v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

/* Mean colour for key k: green just high enough to swing by the full ±R·k. A darker
   mean makes the same luminance swing a larger relative flicker for everyone else. */
const fyMean = k => [FY.R, FY.R * k + FY.FLOOR, 0];

/* Linear colours of the two frames for key k, red scale sa, green scale sb, contrast c. */
function fyPair(k, sa = 1, sb = sa, c = 1) {
  const M = fyMean(k);
  const d = [FY.R * c * sa, -FY.R * c * k * sb, 0];
  return { A: M.map((v, i) => v + d[i]), B: M.map((v, i) => v - d[i]), M, d };
}

/* Calibration: settings are log10 k. Median, spread in dex and as a percentage. */
function fyEstimate(logs) {
  const s = logs.slice().sort((a, b) => a - b);
  const n = s.length;
  const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  const mean = s.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  return { k: 10 ** med, sd, pct: (10 ** sd - 1) * 100 };
}

/* Cells mode. Each cell gets a red level a and a green level b. Letter cells have
   a = b (still at the key's null). Background cells have b = a ± one of FY.OFFSETS,
   every such ordered pair equally often. Near the ends of the level range a level has
   fewer partners, so letter levels are drawn with the same weights: a and b then have
   the same distribution inside and outside the letters. phase ±1 decides which frame
   is the reddish one. */
function fyCellPairs() {
  const pairs = [];
  for (let a = 0; a < FY.LEVELS; a++) {
    for (const o of FY.OFFSETS) for (const b of [a - o, a + o]) if (b >= 0 && b < FY.LEVELS) pairs.push([a, b]);
  }
  return pairs;
}

function fyCells(mask, rand = Math.random) {
  const pairs = fyCellPairs();
  const cells = new Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    const [a, b] = pairs[Math.floor(rand() * pairs.length)];
    cells[i] = { a, b: mask[i] ? a : b, phase: rand() < 0.5 ? 1 : -1 };
  }
  return cells;
}

const fyLevel = j => FY.Q ** j;

/* Flicker an observer with null kObs sees in a cell keyed to kKey: Michelson contrast
   of luminance between the two frames. */
function fyContrast(kObs, kKey, sa = 1, sb = sa, c = 1) {
  const { d, M } = fyPair(kKey, sa, sb, c);
  const dot = v => kObs * v[0] + v[1];
  return Math.abs(dot(d)) / dot(M);
}

/* How well flicker alone separates letter cells from background for an observer:
   |2·AUC − 1| over the cells' contrasts. 1: letters are exactly the cells that behave
   differently; 0: their flicker is distributed like the background's. */
function fySeparability(cells, mask, kObs, kKey) {
  const c = cells.map(x => fyContrast(kObs, kKey, fyLevel(x.a), fyLevel(x.b)));
  const ins = [], out = [];
  c.forEach((v, i) => (mask[i] ? ins : out).push(v));
  if (!ins.length || !out.length) return 0;
  out.sort((a, b) => a - b);
  let auc = 0;
  for (const v of ins) {
    let lo = 0, hi = out.length;                     // count of out < v and out ≤ v
    while (lo < hi) { const m = (lo + hi) >> 1; if (out[m] < v) lo = m + 1; else hi = m; }
    let eq = lo;
    while (eq < out.length && out[eq] === v) eq++;
    auc += lo + (eq - lo) / 2;
  }
  return Math.abs(2 * auc / (ins.length * out.length) - 1);
}

const FY_WORDS = ['RIVER', 'CLOUD', 'MAPLE', 'TIGER', 'LEMON', 'PIANO', 'STORM', 'ORBIT', 'FROST', 'HONEY',
  'CANDLE', 'GARDEN', 'VIOLIN', 'PLANET', 'ANCHOR', 'SILVER', 'MIRROR', 'FOREST', 'ROCKET', 'PEPPER'];

function fyWord(used = [], rand = Math.random) {
  const free = FY_WORDS.filter(w => !used.includes(w));
  return free[Math.floor(rand() * free.length)];
}

if (typeof module !== 'undefined') {
  module.exports = { FY, FY_WORDS, fyEncode, fyDecode, fyMean, fyPair, fyEstimate, fyCellPairs, fyCells, fyLevel,
    fyContrast, fySeparability, fyWord };
}
