'use strict';
/* «Твой принцип» checks. Run: node test/principle.test.js */
const assert = require('node:assert');
const { P_CASES, P_RULES, P_PAIRS, coreOrder, caseById, ruleById, fitRules, violations, pairs, predict, challenge } =
  require('../js/mind/principle-model.js');

// Pool: unique ids, ten core cases, enough reserve for three revisions.
assert.strictEqual(new Set(P_CASES.map(c => c.id)).size, P_CASES.length);
assert.strictEqual(P_CASES.filter(c => c.core).length, 10);
assert.ok(P_CASES.filter(c => !c.core).length >= 3);
assert.ok(P_CASES.every(c => c.q.endsWith('?') && c.text.length > 40));
assert.ok(P_PAIRS.every(([x, y]) => caseById(x).core && caseById(y).core));

// Each pair differs in exactly the feature it names (the last pair differs in none).
const F = ['saved', 'contact', 'force', 'means', 'far'];
const diff = (x, y) => F.filter(k => caseById(x)[k] !== caseById(y)[k]);
assert.deepStrictEqual(diff('switch', 'switch1'), ['saved']);
assert.deepStrictEqual(diff('footbridge', 'pole'), ['contact']);
assert.deepStrictEqual(diff('pole', 'trapdoor'), ['force']);
assert.deepStrictEqual(diff('trapdoor', 'trapdoorFar'), ['far']);
assert.deepStrictEqual(diff('loop', 'loopWeight'), ['means']);
assert.deepStrictEqual(diff('obstacle', 'footbridge'), ['means']);
assert.deepStrictEqual(diff('footbridge', 'surgeon'), []);

// Every rule separates the core cases differently (no two rules are identical on them).
const core = P_CASES.filter(c => c.core);
const sig = r => core.map(c => (r.f(c) ? 1 : 0)).join('');
assert.strictEqual(new Set(P_RULES.map(sig)).size, P_RULES.length);

// A respondent who answers by the double-effect rule is fitted by it, with no violations.
const byMeans = core.map(c => ({ id: c.id, ok: ruleById('means').f(c) }));
assert.strictEqual(fitRules(byMeans)[0].rule.id, 'means');
assert.strictEqual(violations(ruleById('means'), byMeans).length, 0);
assert.ok(violations(ruleById('count'), byMeans).length > 0);

// Typical answers (Hauser et al. 2007; Greene et al. 2009 majorities) break "count".
const typical = { switch: 1, switch1: 0, footbridge: 0, pole: 0, trapdoor: 1, trapdoorFar: 1, loop: 1, loopWeight: 1, obstacle: 1, surgeon: 0 };
const ans = Object.entries(typical).map(([id, ok]) => ({ id, ok: !!ok }));
assert.deepStrictEqual(violations(ruleById('count'), ans).map(a => a.id).sort(), ['footbridge', 'pole', 'surgeon']);
assert.strictEqual(fitRules(ans)[0].rule.id, 'greene');
assert.strictEqual(fitRules(ans)[0].agree, 10);

// Pairs report same/different.
const ps = pairs(ans);
assert.strictEqual(ps.length, P_PAIRS.length);
assert.strictEqual(ps.find(p => p.x.id === 'trapdoor').same, true);
assert.strictEqual(ps.find(p => p.x.id === 'pole').same, false);

// Prediction copies the answer to the most similar case: gas ≡ switch, crane ≡ trapdoor.
assert.strictEqual(predict(caseById('gas'), ans), true);
assert.strictEqual(predict(caseById('crane'), ans), true);
assert.strictEqual(predict(caseById('footbridge100'), [{ id: 'footbridge', ok: false }]), false);

// Challenge picks an unanswered case where the rule and the prediction disagree.
for (let i = 0; i < 30; i++) {
  const c = challenge(ruleById('redirect'), ans);
  assert.ok(!c.core);
  assert.notStrictEqual(ruleById('redirect').f(c), predict(c, ans));
}
assert.strictEqual(challenge(ruleById('count'), P_CASES.map(c => ({ id: c.id, ok: true }))), null);

// Order: all ten core cases, no pair adjacent.
for (let i = 0; i < 50; i++) {
  const o = coreOrder();
  assert.strictEqual(new Set(o).size, 10);
  for (let k = 1; k < o.length; k++) {
    assert.ok(!P_PAIRS.some(([x, y]) => (x === o[k - 1] && y === o[k]) || (y === o[k - 1] && x === o[k])), o.join());
  }
}

console.log('principle: ok');
