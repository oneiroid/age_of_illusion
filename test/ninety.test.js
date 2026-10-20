'use strict';
/* «Девяносто процентов» checks. Run: node test/ninety.test.js */
const assert = require('node:assert');
const { NINE_ITEMS, parseNum, pickItems, drift, binomCdf, median } = require('../js/mind/ninety-model.js');

// Pool: unique ids, integer answers, enough items for several fresh runs.
assert.strictEqual(new Set(NINE_ITEMS.map(it => it.id)).size, NINE_ITEMS.length);
assert.ok(NINE_ITEMS.every(it => Number.isInteger(it.a) && it.q.endsWith('?')));
assert.ok(NINE_ITEMS.length >= 30);

// Parsing as typed in Russian locale.
assert.strictEqual(parseNum('12 756'), 12756);
assert.strictEqual(parseNum('12 756'), 12756);
assert.strictEqual(parseNum('7,5'), 7.5);
assert.strictEqual(parseNum('−3'), -3);
assert.strictEqual(parseNum(''), null);
assert.strictEqual(parseNum('1e3'), null);
assert.strictEqual(parseNum('12,5,1'), null);

// Unseen items come first; no duplicates.
const seen = NINE_ITEMS.slice(0, NINE_ITEMS.length - 4).map(it => it.id);
const pick = pickItems(10, seen);
assert.strictEqual(new Set(pick.map(it => it.id)).size, 10);
assert.ok(pick.slice(0, 4).every(it => !seen.includes(it.id)));

// Drift classification.
assert.deepStrictEqual(drift(1700, 1700, 1756), { kind: 'exact', shift: 0 });
assert.strictEqual(drift(1700, 1728, 1756).kind, 'toward');
assert.ok(Math.abs(drift(1700, 1728, 1756).shift - 0.5) < 1e-9);
assert.strictEqual(drift(1700, 1650, 1756).kind, 'away');
assert.strictEqual(drift(1756, 1700, 1756).kind, 'hit');
assert.strictEqual(drift(100000, 100300, 200000).kind, 'exact');   // within 0.5%

// Binomial: P(X <= 10) = 1; P(X <= 5 | n=10, p=.9) ≈ 0.0016.
assert.ok(Math.abs(binomCdf(10, 0.9, 10) - 1) < 1e-12);
assert.ok(Math.abs(binomCdf(10, 0.9, 5) - 0.0016349) < 1e-6);
assert.ok(Math.abs(binomCdf(10, 0.9, 8) - 0.2639011) < 1e-6);

assert.strictEqual(median([3, 1, 2]), 2);
assert.strictEqual(median([4, 1, 2, 3]), 2.5);
assert.strictEqual(median([]), null);

console.log('ninety: ok');
