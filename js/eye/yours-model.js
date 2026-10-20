'use strict';

/* For Your Eyes Only: colours, calibration estimate, cell layout, flash safety and
   simulated observers. Pure logic, no DOM: loaded by index.html and by test/yours.test.js.

   Two frames alternate: A = M + d, B = M − d, with d = s · (sa, −k · sb, 0) in linear
   light. Their time average is M whatever k is. An observer whose luminance weights red
   and green as w_r : w_g sees no luminance flicker when w_r · sa = w_g · k · sb, so with
   sa = sb the flicker vanishes at k = w_r / w_g: that observer's null point. */

const FY = {
  M: [0.40, 0.30, 0.08],      // mean colour, linear sRGB
  S: 0.30,                    // red half-amplitude, linear
  STD_K: 0.2126 / 0.7152,     // the sRGB (CIE 1924) observer's null
  K_MIN: 0.15, K_MAX: 0.50,   // calibration range; flash-safe throughout (see fyFlash)
  LEVELS: 10, Q: 0.92,        // amplitude levels of the cells mode: CELL · Q^j, j < LEVELS
  CELL: 0.85,                 // keeps every cells-mode pair below the flash threshold
  OFFSETS: [1, 2],            // |a − b| of background cells, in levels
  W_B: 0.0722 / 0.7152,       // blue weight relative to green, standard observer
};

const fyEncode = x => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
const fyDecode = v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

/* Linear colours of the two frames for null ratio k, red scale sa, green scale sb. */
function fyPair(k, sa = 1, sb = sa) {
  const d = [FY.S * sa, -FY.S * k * sb, 0];
  return { A: FY.M.map((v, i) => v + d[i]), B: FY.M.map((v, i) => v - d[i]), d };
}

/* WCAG 2.x flash test for one alternation (relative luminance of the standard observer;
   R, G, B linear as in its relative-luminance definition). A pair is a general flash if
   luminance changes by ≥ 0.1 (darker below 0.8), a red flash if either colour is
   saturated red (R / (R+G+B) ≥ 0.8) with a large enough red change. */
function fyFlash(A, B) {
  const Y = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const red = c => c[0] / (c[0] + c[1] + c[2]);
  const dY = Math.abs(Y(A) - Y(B));
  const redA = red(A), redB = red(B);
  const dRed = Math.abs((A[0] - A[1] - A[2]) - (B[0] - B[1] - B[2])) * 320;
  return {
    dY, redMax: Math.max(redA, redB),
    general: dY >= 0.1 && Math.min(Y(A), Y(B)) < 0.8,
    red: Math.max(redA, redB) >= 0.8 && dRed > 20,
  };
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

const fyLevel = j => FY.CELL * FY.Q ** j;

/* Flicker an observer with null kObs sees in a cell keyed to kKey: Michelson contrast
   of luminance between the two frames. */
function fyContrast(kObs, kKey, sa = 1, sb = sa) {
  const { d } = fyPair(kKey, sa, sb);
  const w = [kObs, 1, FY.W_B];
  const dot = c => w[0] * c[0] + w[1] * c[1] + w[2] * c[2];
  return Math.abs(dot(d)) / dot(FY.M);
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
  module.exports = { FY, FY_WORDS, fyEncode, fyDecode, fyPair, fyFlash, fyEstimate, fyCellPairs, fyCells, fyLevel,
    fyContrast, fySeparability, fyWord };
}
