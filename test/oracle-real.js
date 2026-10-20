'use strict';
/* Scores predictors on real human sequences: Guseva, Bogler, Allefeld & Haynes (2023),
   "Instruction effects on randomness in sequence generation", data at osf.io/z8rjx (CC BY 4.0).
   Not in the repo: python3 test/guseva-convert.py dat.csv seqs.json, then
     node test/oracle-real.js path/to/seqs.json [model…]
   Each 200-choice block gives one 100-press round from a fresh model.
   Conditions: 1 random, 2 free, 3 irregular, 4 mental coin, 5 perceptual guessing (excluded). */
const fs = require('node:fs');
const M = require('../js/mind/oracle-model.js');

const [file, ...names] = process.argv.slice(2);
// Odd subjects only: the population prior in oracle-model.js was fitted on even ones.
const data = JSON.parse(fs.readFileSync(file, 'utf8')).filter(d => d.cond !== 5 && d.sub % 2 === 1);
const models = names.length ? names : Object.keys(M.MODELS);
const N = 100;

const score = (make, seq) => {
  const o = make(); let h = 0;
  for (const x of seq) { h += o.predict() === x; o.update(x); }
  return h;
};

const COND = { 1: 'random', 2: 'free', 3: 'irregular', 4: 'coin' };
console.log('condition'.padEnd(12) + models.map(m => m.padStart(12)).join('') + '   (mean hits / 100; share of rounds ≥ 59)');
for (const c of [1, 2, 3, 4, 'all']) {
  const set = data.filter(d => c === 'all' || d.cond === c);
  const cells = models.map(m => {
    const hs = set.map(d => score(M.MODELS[m], [...d.seq.slice(0, N)].map(Number)));
    const mean = hs.reduce((a, b) => a + b, 0) / hs.length;
    const sig = hs.filter(h => h >= 59).length / hs.length;
    return `${mean.toFixed(1)} ${Math.round(sig * 100)}%`.padStart(12);
  });
  console.log(String(COND[c] || c).padEnd(12) + cells.join(''));
}
