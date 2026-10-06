'use strict';
/* Checks the model against the claims of the Two-Phase Law. Run: node test.js */
const assert = require('node:assert');
const TP = require('./model.js');

function slowSpan(m) {
  const s = TP.run(TP.create({ manage: m, seed: 7, lineages: 60 }), 400);
  const stuck = s.lineages.filter(L => L.mode === 'slow' && L.tau > 200);
  return { s, stuck };
}

// No eternal plateau: even extreme management only postpones the fast phase.
const spans = [0, 0.3, 1, 5, 50].map(m => {
  const { s, stuck } = slowSpan(m);
  assert.strictEqual(stuck.length, 0, `manage=${m}: a slow phase lasted >200`);
  assert.ok(s.stats.bif + s.stats.rev > 0, `manage=${m}: no fast phase resolved`);
  return s.stats.longestSlow;
});

// Managed delay prolongs slow phases, monotonically.
for (let i = 1; i < spans.length; i++) assert.ok(spans[i] > spans[i - 1], `spans not increasing: ${spans}`);

// Every fast phase resolves as exactly one of bifurcation or revolution.
const s = TP.run(TP.create({ seed: 11 }), 800);
const kinds = new Set(s.events.map(e => e.kind));
for (const k of kinds) assert.ok(['bif', 'rev', 'ext', 'def'].includes(k));

// Revolutions fall at least one level; bifurcations climb exactly one.
for (const e of s.events) {
  if (e.kind === 'bif' || e.kind === 'def') assert.strictEqual(e.to, e.from + 1);
  else assert.ok(e.to <= e.from - 1);
}

// Convergence: some lineage reaches DeF, though many lineages do not.
assert.ok(s.stats.def > 0, 'no lineage reached DeF');
assert.ok(s.stats.ext > 0, 'no lineage ever fell past its origin');

// Readiness matters: more complexity at the crisis, better odds.
assert.ok(TP.bifurcationOdds(s, 0.9) > TP.bifurcationOdds(s, 0.5));

console.log('ok  longest slow phase by management [0,.3,1,5,50]:', spans.map(x => x.toFixed(1)).join(', '));
console.log('ok  800t:', JSON.stringify(s.stats));
