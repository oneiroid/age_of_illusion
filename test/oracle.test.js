'use strict';
/* Oracle model checks. Run: node test/oracle.test.js */
const assert = require('node:assert');
const { oracleHits, seqStats, binomTail, makeOracle } = require('../js/mind/oracle-model.js');

const rate = hits => hits.filter(Boolean).length / hits.length;

// Fair coin: the oracle must not beat chance.
const coin = [];
for (let r = 0; r < 200; r++) {
  const s = Array.from({ length: 100 }, () => (Math.random() < 0.5 ? 1 : 0));
  coin.push(rate(oracleHits(s)));
}
const coinMean = coin.reduce((a, b) => a + b) / coin.length;
assert.ok(Math.abs(coinMean - 0.5) < 0.02, `coin: ${coinMean}`);

// Typical human-made "random" sequence: switches ~60% of the time, avoids runs over 3.
function human(n) {
  const s = [Math.random() < 0.5 ? 1 : 0];
  let run = 1;
  while (s.length < n) {
    const pSwitch = run >= 3 ? 0.9 : 0.6;
    const x = Math.random() < pSwitch ? 1 - s[s.length - 1] : s[s.length - 1];
    run = x === s[s.length - 1] ? run + 1 : 1;
    s.push(x);
  }
  return s;
}
const hum = [];
for (let r = 0; r < 200; r++) hum.push(rate(oracleHits(human(100))));
const humMean = hum.reduce((a, b) => a + b) / hum.length;
assert.ok(humMean > 0.56, `human-like: ${humMean}`);

// Round-2 player who reacts to being caught (switch after a hit, repeat after a miss, 70% of the time).
let react = 0;
for (let r = 0; r < 100; r++) {
  const o = makeOracle(); let last = 0, caught = false;
  for (let i = 0; i < 100; i++) {
    const g = o.predict();
    const x = i && Math.random() < 0.7 ? (caught ? 1 - last : last) : (Math.random() < 0.5 ? 1 : 0);
    caught = g === x; react += caught; last = x; o.update(x);
  }
}
assert.ok(react / 10000 > 0.72, `reactive: ${react / 10000}`);

// A strict alternator is caught almost immediately.
assert.ok(rate(oracleHits(Array.from({ length: 100 }, (_, i) => i % 2))) > 0.9);

assert.deepStrictEqual(seqStats([0, 0, 1, 1, 1, 0]), { longest: 3, switchRate: 0.4, ones: 3 });
assert.ok(Math.abs(binomTail(100, 50) - 0.5398) < 1e-3);
assert.strictEqual(binomTail(10, 0), 1);

console.log(`ok — coin ${(coinMean * 100).toFixed(1)}%, human-like ${(humMean * 100).toFixed(1)}%, reactive ${(react / 100).toFixed(1)}%`);
