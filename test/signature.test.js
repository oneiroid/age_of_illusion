'use strict';
/* «Подпись» checks. Run: node test/signature.test.js */
const assert = require('node:assert');
const nodeCrypto = require('node:crypto');
const { SIG, SIG_SCALE, SIG_PAIRS, sigPick, sigOrder, sigCaught, sigMirror, sigSwappable, sigScore, sigChooseSwaps,
  sigControls, sigK, sigRecall, sigSealText, sigSalt, sha256 } = require('../js/mind/signature-model.js');
// Seeded PRNG (mulberry32, as in core.js).
const rngOf = seed => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// SHA-256: standard vectors, then agreement with Node on Cyrillic text across block boundaries.
assert.strictEqual(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
assert.strictEqual(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
assert.strictEqual(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
  '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
const R = rngOf(7);
for (let n = 0; n < 300; n++) {
  let s = '';
  for (let i = 0; i < n; i++) s += R() < 0.5 ? 'а' : String.fromCharCode(32 + Math.floor(R() * 90));
  assert.strictEqual(sha256(s), nodeCrypto.createHash('sha256').update(s, 'utf8').digest('hex'), `length ${n}`);
}

// Pool: unique ids, two statements each, room for the doubled length.
assert.strictEqual(new Set(SIG_PAIRS.map(p => p.id)).size, SIG_PAIRS.length);
assert.ok(SIG_PAIRS.every(p => p.s.length === 2 && p.s.every(t => t.endsWith('.')) && p.theme));
assert.ok(SIG_PAIRS.length >= 2 * (SIG.pairs1 + SIG.pairs2));
assert.ok(SIG.swaps1 + SIG.control <= 2 * SIG.pairs1 && SIG.swaps1 <= SIG.pairs1 && SIG.maxK2 <= SIG.pairs2);
assert.strictEqual(SIG_SCALE.length, 8);

// Picking: rounds are disjoint, both halves of each pair, never adjacent; unseen pairs first.
for (let t = 0; t < 50; t++) {
  const rand = rngOf(t);
  const seen = SIG_PAIRS.slice(0, SIG_PAIRS.length - 3).map(p => p.id);
  const [r1, r2] = sigPick([SIG.pairs1, SIG.pairs2], seen, rand);
  assert.strictEqual(r1.length, 2 * SIG.pairs1);
  assert.strictEqual(r2.length, 2 * SIG.pairs2);
  const p1 = new Set(r1.map(it => it.pair)), p2 = new Set(r2.map(it => it.pair));
  assert.strictEqual(p1.size, SIG.pairs1);
  assert.ok([...p2].every(p => !p1.has(p)));
  for (const r of [r1, r2]) {
    assert.ok(r.every(it => r.filter(x => x.pair === it.pair).length === 2));
    assert.ok(r.every((it, i) => i === 0 || r[i - 1].pair !== it.pair));
  }
  assert.strictEqual([...p1].filter(p => !seen.includes(p)).length, 3);
}

// Profile order: a permutation, no pair side by side, never the answering order.
for (let t = 0; t < 200; t++) {
  const its = sigPick([SIG.pairs1], [], rngOf(300 + t))[0];
  const o = sigOrder(its, rngOf(t));
  assert.deepStrictEqual(o.slice().sort((x, y) => x - y), its.map((_, i) => i));
  assert.ok(o.every((x, k) => k === 0 || its[o[k - 1]].pair !== its[x].pair));
  assert.ok(o.some((x, k) => x !== k));
}

// A swap is caught when the profile answer goes back to the original side of the midpoint.
assert.ok(sigCaught(3, 3) && sigCaught(3, 1) && sigCaught(6, 5));
assert.ok(!sigCaught(3, 5) && !sigCaught(3, 4) && !sigCaught(6, 2));

// Mirror and candidates.
assert.deepStrictEqual([1, 2, 3, 4, 5, 6, 7].filter(sigSwappable), [2, 3, 5, 6]);
assert.ok([2, 3, 5, 6].every(r => (r - 4) * (sigMirror(r) - 4) < 0));

// Scoring: a swap that makes the pair agree beats one that breaks agreement; moderate beats near-extreme;
// slow and revised answers score higher.
const items = sigPick([4], [], rngOf(1))[0];
const base = () => items.map(() => ({ r: 4, ms: 3000, changes: 0 }));
const at = (ans, i) => sigScore(items, ans, i).p;
const i0 = 0, j0 = items.findIndex((it, k) => k && it.pair === items[0].pair);
{
  const a = base(); a[i0].r = 3; a[j0].r = 3;              // both disagree with opposite statements: incoherent
  const b = base(); b[i0].r = 3; b[j0].r = 5;              // coherent
  assert.ok(at(a, i0) > at(b, i0));
  assert.ok(sigScore(items, a, i0).f.gain === 2 && sigScore(items, b, i0).f.gain === -2);
  const c = base(); c[i0].r = 2; c[j0].r = 6;
  assert.ok(at(b, i0) > at(c, i0));
  const d = base(); d[i0].r = 3; d[j0].r = 5; d[i0].ms = 9000;
  assert.ok(at(d, i0) > at(b, i0));
  const e = base(); e[i0].r = 3; e[j0].r = 5; e[i0].changes = 2;
  assert.ok(at(e, i0) > at(b, i0));
}

// Choosing: only swappable answers, at most one per pair, sorted by p, bets follow p.
for (let t = 0; t < 200; t++) {
  const rand = rngOf(100 + t);
  const its = sigPick([SIG.pairs1], [], rand)[0];
  const ans = its.map(() => ({ r: 1 + Math.floor(rand() * 7), ms: 800 + rand() * 6000, changes: Math.floor(rand() * 3) }));
  const sw = sigChooseSwaps(its, ans, SIG.swaps1);
  assert.ok(sw.length <= SIG.swaps1);
  assert.ok(sw.every(s => sigSwappable(s.from) && s.to === sigMirror(s.from) && ans[s.i].r === s.from));
  assert.strictEqual(new Set(sw.map(s => its[s.i].pair)).size, sw.length);
  assert.ok(sw.every((s, k) => k === 0 || sw[k - 1].p >= s.p));
  assert.ok(sw.every(s => s.bet === (s.p >= 0.5 ? 'accept' : 'detect')));
  const avail = new Set(its.filter((it, i) => sigSwappable(ans[i].r)).map(it => it.pair)).size;
  assert.strictEqual(sw.length, Math.min(SIG.swaps1, avail));
  const ctl = sigControls(its, sw, SIG.control, rand);
  assert.strictEqual(ctl.length, SIG.control);
  assert.ok(ctl.every(i => !sw.some(s => s.i === i)));
}
// Nothing to swap when every answer is extreme or neutral.
assert.deepStrictEqual(sigChooseSwaps(items, items.map((_, i) => ({ r: [1, 4, 7][i % 3], ms: 2000, changes: 0 })), 2), []);

// Seal: the text names every swap and the salt; any edit changes the hash.
{
  const ans = base(); ans[i0].r = 3; ans[j0].r = 3;
  const sw = sigChooseSwaps(items, ans, 2);
  const salt = sigSalt();
  assert.match(salt, /^[0-9a-f]{32}$/);
  const text = sigSealText(1, items, sw, salt);
  assert.ok(sw.every(s => text.includes(items[s.i].text) && text.includes(`ответ ${s.from} заменён на ${s.to}`)));
  assert.ok(text.endsWith(salt));
  assert.notStrictEqual(sha256(text), sha256(text.replace('Ставка: не', 'Ставка:')));
  assert.match(sigSealText(1, items, [], salt), /Подмен нет/);
  assert.match(sigSealText(2, items, [], salt), /Подмен: 0\./);
}

// Round 2 count: uniform over 0..maxK.
{
  const rand = rngOf(5), n = new Array(SIG.maxK2 + 1).fill(0);
  for (let t = 0; t < 6000; t++) n[sigK(SIG.maxK2, rand)]++;
  assert.ok(n.every(c => Math.abs(c / 6000 - 1 / n.length) < 0.03));
}

// Recall classification.
assert.strictEqual(sigRecall(3, 5, 3), 'exact');
assert.strictEqual(sigRecall(3, 5, 5), 'shown');
assert.strictEqual(sigRecall(3, 5, 6), 'toward');
assert.strictEqual(sigRecall(3, 5, 2), 'other');
assert.strictEqual(sigRecall(3, 5, 4), 'other');

console.log('signature: ok');
