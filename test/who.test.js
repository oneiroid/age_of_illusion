'use strict';
/* «Кто начал?» checks. Run: node test/who.test.js */
const assert = require('node:assert');
const { WHO_ROUNDS, makeGame, scores, defections, starter, feuds, simulate, makeRecords } =
  require('../js/mind/who-model.js');

function play(policy, seed = 1) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = makeGame(rand);
  while (!g.done) g.play(policy(g.log));
  return g.log;
}

const tft = log => (log.us.length ? log.us[log.us.length - 1] : 'C');
const allC = () => 'C';

// Tit-for-tat player against the tit-for-tat bot: the first glitch starts an echo,
// the first defection is the player's answer to a phantom, and the channel is to blame.
for (let seed = 1; seed < 50; seed++) {
  const log = play(tft, seed);
  assert.strictEqual(log.u.length, WHO_ROUNDS);
  assert.strictEqual(log.glitches.length, 2, `seed ${seed}: ${JSON.stringify(log.glitches)}`);
  const [g1, g2] = log.glitches;
  assert.ok(g1.dir === 'toUser' && g1.r >= 4 && g1.r <= 6 && log.b[g1.r] === 'C' && log.us[g1.r] === 'D');
  assert.ok(g2.dir === 'toBot' && g2.r >= 14 && g2.r - g1.r >= 7 && log.u[g2.r] === 'C' && log.bs[g2.r] === 'D');
  const st = starter(log);
  assert.deepStrictEqual([st.who, st.r, st.dir], ['channel', g1.r + 1, 'toUser']);
  const d = defections(log);
  assert.strictEqual(d[0].kind, 'phantom');
  assert.ok(d.every(x => x.kind !== 'first'));
  // Two tit-for-tats echo forever: neither feud heals; feuds do not overlap,
  // so their losses add up to the player's total shortfall.
  const f = feuds(log);
  assert.deepStrictEqual(f.map(x => x.until), ['next', 'end']);
  assert.ok(f.every(x => x.rounds > 0));
  const lostBefore = log.u.slice(0, g1.r + 1).reduce((s, m, r) => s + 3 - scores([m], [log.b[r]])[0], 0);
  assert.strictEqual(f[0].lost + f[1].lost + lostBefore, 3 * WHO_ROUNDS - scores(log.u, log.b)[0]);
}

// Bot never defects first; an all-cooperate player is only ever answered.
{
  const log = play(allC);
  assert.ok(defections(log).filter(x => x.who === 'bot').every(x => x.kind !== 'first'));
  assert.ok(defections(log).every(x => x.who === 'bot'));
  assert.strictEqual(starter(log).who, 'channel');
  assert.strictEqual(starter(log).dir, 'toBot');
  // Bot answers the phantom once, the player keeps cooperating: the feud heals in a round.
  assert.ok(feuds(log).every(x => x.until === 'heal'));
}

// Player who defects in round 2 started it.
{
  const log = play(l => (l.u.length === 2 ? 'D' : tft(l)));
  assert.deepStrictEqual([starter(log).who, starter(log).r], ['user', 2]);
}

// Payoffs.
assert.deepStrictEqual(scores(['C', 'D', 'D', 'C'], ['C', 'C', 'D', 'D']), [3 + 5 + 1 + 0, 3 + 0 + 1 + 5]);

// Simulated records always contain a conflict on both sides.
for (let i = 0; i < 50; i++) {
  const r = simulate('generous', 'prober', 16);
  assert.ok(r.a.includes('D') && r.b.includes('D') && r.a.length === 16);
}

// Records: three, one of them the player's excerpt with matching moves.
{
  const log = play(tft, 7);
  const recs = makeRecords(log);
  assert.strictEqual(recs.length, 3);
  const own = recs.filter(r => r.own);
  assert.strictEqual(own.length, 1);
  const o = own[0];
  const mine = o.userIs === 'a' ? o.a : o.b;
  assert.deepStrictEqual(mine, log.u.slice(o.from, o.from + mine.length));
  assert.ok(recs.every(r => r.a.length === mine.length));
  assert.ok(o.from <= log.glitches[0].r && o.from + mine.length > log.glitches[1].r);
}

console.log('who: ok');
