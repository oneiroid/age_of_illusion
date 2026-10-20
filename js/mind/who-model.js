'use strict';

/* «Кто начал?» — iterated prisoner's dilemma over a channel that sometimes delivers
   the opposite move. Moves: 'C' cooperate, 'D' defect. */

const WHO_ROUNDS = 30;                                   // not shown to the player
const WHO_PAY = { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] };   // [first, second]

const flip = m => (m === 'C' ? 'D' : 'C');

/* One game. The bot plays tit-for-tat on what it received. Two glitches, both
   turning a cooperation into a defection: the bot's move on its way to the player
   at the first round >= g1 where the bot cooperates, and the player's move on its
   way to the bot at the first round >= g2 (and at least 7 after the first glitch)
   where the player cooperates. */
function makeGame(rand = Math.random) {
  const g1 = 4 + Math.floor(rand() * 3);                 // 4..6 (0-based round)
  const g2min = 14 + Math.floor(rand() * 3);             // 14..16
  const log = { u: [], b: [], us: [], bs: [], glitches: [] };

  return {
    log,
    get round() { return log.u.length; },
    get done() { return log.u.length >= WHO_ROUNDS; },
    /* Player's move → what the player sees of the bot's move. */
    play(u) {
      const r = log.u.length;
      const b = r === 0 ? 'C' : log.bs[r - 1];
      const toUser = !log.glitches.some(g => g.dir === 'toUser') && r >= g1 && b === 'C';
      const first = log.glitches.find(g => g.dir === 'toUser');
      const toBot = first && !log.glitches.some(g => g.dir === 'toBot') &&
        r >= Math.max(g2min, first.r + 7) && u === 'C';
      log.u.push(u);
      log.b.push(b);
      log.us.push(toUser ? flip(b) : b);
      log.bs.push(toBot ? flip(u) : u);
      if (toUser) log.glitches.push({ r, dir: 'toUser' });
      if (toBot) log.glitches.push({ r, dir: 'toBot' });
      return log.us[r];
    },
  };
}

function scores(a, b) {
  let sa = 0, sb = 0;
  for (let r = 0; r < a.length; r++) {
    const [x, y] = WHO_PAY[a[r] + b[r]];
    sa += x; sb += y;
  }
  return [sa, sb];
}

/* Why each defection happened, from the defector's point of view.
   'first': nothing provoked it (round 0, or the defector last saw cooperation);
   'phantom': answer to a defection that existed only in the channel;
   'answer': answer to a real defection. */
function defections(log) {
  const out = [];
  const glitchAt = (r, dir) => log.glitches.some(g => g.r === r && g.dir === dir);
  for (let r = 0; r < log.u.length; r++) {
    for (const who of ['user', 'bot']) {
      const move = who === 'user' ? log.u[r] : log.b[r];
      if (move !== 'D') continue;
      const seen = r ? (who === 'user' ? log.us[r - 1] : log.bs[r - 1]) : null;
      const kind = seen !== 'D' ? 'first'
        : glitchAt(r - 1, who === 'user' ? 'toUser' : 'toBot') ? 'phantom' : 'answer';
      out.push({ r, who, kind });
    }
  }
  return out;
}

/* Who started the first conflict: the first defection in the game traced to its cause.
   { who: 'user' | 'channel' | 'none', r, glitch } */
function starter(log) {
  const d = defections(log)[0];
  if (!d) return { who: 'none' };
  if (d.kind === 'first') return { who: d.who === 'user' ? 'user' : 'none', r: d.r };   // the bot never opens
  return { who: 'channel', r: d.r, glitch: d.r - 1, dir: d.who === 'user' ? 'toUser' : 'toBot' };
}

/* Rounds of conflict each glitch set off: from the round after it until the first
   round where both actually cooperated, the next glitch, or the end.
   until: 'heal' | 'next' | 'end'; lost: player's points below 3 a round. */
function feuds(log) {
  return log.glitches.map((g, i) => {
    const next = log.glitches[i + 1];
    const stop = next ? next.r + 1 : log.u.length;
    let rounds = 0, lost = 0, r = g.r + 1, until = next ? 'next' : 'end';
    for (; r < stop; r++) {
      if (log.u[r] === 'C' && log.b[r] === 'C') { until = 'heal'; break; }
      rounds++;
      lost += 3 - WHO_PAY[log.u[r] + log.b[r]][0];
    }
    return { ...g, rounds, lost, until };
  });
}

/* Strategies for the other records. Each sees only the opponent's received moves. */
const WHO_STRATS = {
  tft: (seen) => (seen.length ? seen[seen.length - 1] : 'C'),
  generous: (seen, rand) => (seen.length && seen[seen.length - 1] === 'D' && rand() > 0.35 ? 'D' : 'C'),
  grudger: (seen) => (seen.includes('D') ? 'D' : 'C'),
  prober: (seen, rand) => (rand() < 0.12 ? 'D' : seen.length ? seen[seen.length - 1] : 'C'),
  sly: (seen, rand) => (seen.length >= 3 && rand() < 0.2 ? 'D' : seen.length ? seen[seen.length - 1] : 'C'),
};

/* A game between two strategies with the same channel noise, as actual moves.
   Retries until both players defect at least once, so every record has a conflict. */
function simulate(sa, sb, n, rand = Math.random, noise = 1 / 15) {
  for (let tries = 0; tries < 200; tries++) {
    const a = [], b = [], as = [], bs = [];
    for (let r = 0; r < n; r++) {
      const x = WHO_STRATS[sa](bs, rand), y = WHO_STRATS[sb](as, rand);
      a.push(x); b.push(y);
      bs.push(rand() < noise ? flip(y) : y);          // what A saw of B
      as.push(rand() < noise ? flip(x) : x);          // what B saw of A
    }
    if (a.includes('D') && b.includes('D')) return { a, b };
  }
  throw new Error('simulate: no conflict');
}

/* Three records to rate: two simulated games and an excerpt of the player's own,
   with the player shown as A or B at random. Excerpt: from two rounds before the
   first glitch to five after the second (or twelve after the first). */
function makeRecords(log, rand = Math.random) {
  const gs = log.glitches;
  const from = gs.length ? Math.max(0, gs[0].r - 2) : 0;
  const to = Math.min(log.u.length, gs.length > 1 ? gs[1].r + 6 : gs.length ? gs[0].r + 13 : 18);
  const n = to - from;
  const userIsA = rand() < 0.5;
  const own = userIsA
    ? { a: log.u.slice(from, to), b: log.b.slice(from, to) }
    : { a: log.b.slice(from, to), b: log.u.slice(from, to) };
  own.own = true;
  own.userIs = userIsA ? 'a' : 'b';
  own.from = from;

  const pairs = [['prober', 'generous'], ['sly', 'tft'], ['grudger', 'prober'], ['tft', 'sly']];
  const k = Math.floor(rand() * pairs.length);
  const others = [pairs[k], pairs[(k + 1 + Math.floor(rand() * (pairs.length - 1))) % pairs.length]]
    .map(([x, y]) => simulate(x, y, n, rand));
  const pos = Math.floor(rand() * 3);
  const recs = others.slice();
  recs.splice(pos, 0, own);
  return recs;
}

if (typeof module !== 'undefined') {
  module.exports = { WHO_ROUNDS, WHO_PAY, makeGame, scores, defections, starter, feuds, simulate, makeRecords };
}
