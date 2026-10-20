'use strict';

/* Baseline for the benchmarks (after Shannon 1953 and Hagelbarger's SEER, 1956):
   context counters over the last k keys or stay/switch moves; the counter with the
   best recent record makes the call. predict() must be called before each update(x). */
function makeBestCounter(maxK = 5, decay = 0.98) {
  const models = [];
  for (let k = 0; k <= maxK; k++) {
    models.push({ k, moves: false, counts: new Map(), score: 0, ctx: null, guess: null });
    models.push({ k, moves: true, counts: new Map(), score: 0, ctx: null, guess: null });
  }
  const seq = [];

  function context(m) {
    const n = seq.length;
    if (!m.moves) return n < m.k ? null : seq.slice(n - m.k).join('');
    if (n < m.k + 1) return null;
    let s = '';
    for (let i = n - m.k; i < n; i++) s += seq[i] === seq[i - 1] ? 's' : 'w';
    return s;
  }

  function predict() {
    const last = seq[seq.length - 1];
    let best = null;
    for (const m of models) {
      m.guess = null;
      m.ctx = context(m);
      if (m.ctx === null) continue;
      const c = m.counts.get(m.ctx);
      if (!c || c[0] === c[1]) continue;
      const sym = c[1] > c[0] ? 1 : 0;
      m.guess = m.moves ? (sym ? 1 - last : last) : sym;
      if (!best || m.score > best.score) best = m;
    }
    return best ? best.guess : (Math.random() < 0.5 ? 0 : 1);
  }

  function update(x) {
    const last = seq[seq.length - 1];
    for (const m of models) {
      if (m.guess !== null) m.score = decay * m.score + (m.guess === x ? 1 : -1);
      if (m.ctx === null) continue;
      const sym = m.moves ? (x === last ? 0 : 1) : x;
      let c = m.counts.get(m.ctx);
      if (!c) m.counts.set(m.ctx, c = [0, 0]);
      c[sym]++;
    }
    seq.push(x);
  }

  return { predict, update };
}

/* Population prior: logistic regression of "next press switches key" fitted on
   half the participants of Guseva et al. (2023, osf.io/z8rjx; 388 people × 1,000
   choices). Weights follow FEATURES below. */
const POP = {
  bias: 0.015, mv5: 0.196, mv4: 0.167, mv3: 0.185, mv2: 0.381, mv1: 0.183,
  run2: -0.333, run3: 0.264, run4: 0.189, run5: -0.241, bal8: 0.092, bal16: -0.385, key: 0.021,
};

/* Feature vector for "press t switches from press t-1" (seq has t presses).
   mvK: the move K presses back (+1 switch, -1 stay); runK: current run length is K (5 = 5+);
   balW: share of the last W presses equal to the last key, centred; key: last key ±1;
   hit / hitmv: last bet hit (±1) and its product with the last move — learned per person. */
function features(seq, hits) {
  const t = seq.length, last = seq[t - 1];
  const f = { bias: 1 };
  for (let k = 1; k <= 5; k++) f['mv' + k] = t - k >= 1 ? (seq[t - k] !== seq[t - k - 1] ? 1 : -1) : 0;
  let run = 1;
  while (run < t && seq[t - 1 - run] === last) run++;
  for (let r = 2; r <= 5; r++) f['run' + r] = Math.min(run, 5) === r ? 1 : 0;
  for (const w of [8, 16]) {
    let d = 0;
    for (let i = Math.max(0, t - w); i < t; i++) d += seq[i] === last ? 1 : -1;
    f['bal' + w] = d / w;
  }
  f.key = last ? 1 : -1;
  const h = hits.length ? (hits[hits.length - 1] ? 1 : -1) : 0;
  f.hit = h;
  f.hitmv = h * f.mv1;
  return f;
}

/* Online logistic regression from the population prior, adapted to one person:
   a gradient step per press, with a pull back toward the prior. */
function makeAdaptive({ lr = 0.1, pull = 0.01 } = {}) {
  const seq = [], hits = [];
  const w = Object.assign({ hit: 0, hitmv: 0 }, POP);
  let f = null, guess = null, pSw = 0.5;

  function prob() {
    if (!seq.length) return 0.5;
    f = features(seq, hits);
    let z = 0;
    for (const k in f) z += w[k] * f[k];
    pSw = 1 / (1 + Math.exp(-z));
    return seq[seq.length - 1] ? 1 - pSw : pSw;             // P(next = 1)
  }

  function predict() {
    const p = prob();
    guess = Math.abs(p - 0.5) < 1e-9 ? (Math.random() < 0.5 ? 0 : 1) : Number(p > 0.5);
    return guess;
  }

  function update(x) {
    if (f) {
      const y = x !== seq[seq.length - 1] ? 1 : 0;
      for (const k in f) w[k] += lr * ((y - pSw) * f[k] - pull * (w[k] - (POP[k] || 0)));
    }
    f = null;
    hits.push(guess === x);
    seq.push(x);
  }

  return { predict, update, prob };
}

/* Bayesian mixture of small experts with fixed-share weights.
   Each expert gives P(next = 1); its weight is multiplied by the probability it
   gave to what actually happened, then a share α of all weight is spread evenly,
   so a person who changes strategy mid-round is followed within a few presses.
   Experts (each counter also in a forgetting variant):
   - key context: the last k keys (k = 0..6) → next key
   - move context: the last k stay/switch moves → stay or switch
   - run: current run length → stay or switch
   - balance: surplus of one key in the last 8 / 16 → next key
   - outcome: whether the last bets hit, plus the last move → stay or switch
     (players react to being caught once bets are visible)
   - match: the longest earlier repeat of the recent history → what followed it
   - population: logistic regression fitted on other people (see POP), adapted
     online to this one; it starts with `prior` times the weight of any other expert
   predict() must be called before each update(x). */
function makeOracle({ alpha = 0.01, decays = [1, 0.9], maxK = 6, lr = 0.05, prior = 40 } = {}) {
  const seq = [], hits = [];
  let run = 0;

  const S = {
    key: k => (seq.length < k ? null : 'k' + seq.slice(seq.length - k).join('')),
    move: k => {
      const n = seq.length;
      if (n < k + 1) return null;
      let c = 'm';
      for (let i = n - k; i < n; i++) c += seq[i] === seq[i - 1] ? 's' : 'w';
      return c;
    },
  };

  const ctxs = [];
  for (let k = 0; k <= maxK; k++) {
    ctxs.push({ name: 'key' + k, target: 'key', ctx: () => S.key(k) });
    ctxs.push({ name: 'move' + k, target: 'move', ctx: () => S.move(k) });
  }
  ctxs.push({ name: 'run', target: 'move', ctx: () => (seq.length ? 'r' + Math.min(run, 6) : null) });
  ctxs.push({ name: 'run+move2', target: 'move', ctx: () => (seq.length ? 'r' + Math.min(run, 6) + S.move(2) : null) });
  for (const w of [8, 16]) ctxs.push({ name: 'balance' + w, target: 'key', ctx: () => {
    if (seq.length < 4) return null;
    const win = seq.slice(-w);
    const d = 2 * win.filter(Boolean).length - win.length;
    return 'b' + Math.max(-4, Math.min(4, Math.round(d / 2)));
  } });
  for (const k of [1, 2]) {
    ctxs.push({ name: 'hit' + k + '+move', target: 'move', ctx: () => (hits.length < k ? null : 'h' + hits.slice(-k).map(Number).join('') + S.move(1)) });
    ctxs.push({ name: 'hit' + k + '+key', target: 'key', ctx: () => (hits.length < k ? null : 'h' + hits.slice(-k).map(Number).join('') + S.key(1)) });
  }

  const experts = [];
  for (const c of ctxs) for (const d of decays) {
    const counts = new Map();
    let key = null;
    experts.push({
      name: c.name + (d < 1 ? '~' : ''),
      p() {
        key = c.ctx();
        if (key === null) return 0.5;
        const n = counts.get(key) || [0, 0];
        const q = (n[1] + 0.5) / (n[0] + n[1] + 1);           // KT estimate of target = 1
        return c.target === 'key' ? q : (seq[seq.length - 1] ? 1 - q : q);
      },
      learn(x) {
        if (key === null) return;
        const t = c.target === 'key' ? x : Number(x !== seq[seq.length - 1]);
        const n = counts.get(key) || [0, 0];
        n[0] *= d; n[1] *= d; n[t]++;
        counts.set(key, n);
      },
    });
  }

  // Longest-match expert: its confidence is learned per match length.
  {
    const acc = new Map();
    let bet = null, len = 0;
    experts.push({
      name: 'match',
      p() {
        bet = null; len = 0;
        const n = seq.length;
        for (let L = Math.min(16, n - 1); L >= 2 && bet === null; L--) {
          for (let j = n - 1; j >= L; j--) {                 // occurrence ending at j-1, followed by seq[j]
            let ok = true;
            for (let i = 1; i <= L; i++) if (seq[j - i] !== seq[n - i]) { ok = false; break; }
            if (ok && j < n) { bet = seq[j]; len = L; break; }
          }
        }
        if (bet === null) return 0.5;
        const a = acc.get(Math.min(len, 8)) || [1, 1];
        const q = a[0] / (a[0] + a[1]);
        return bet ? q : 1 - q;
      },
      learn(x) {
        if (bet === null) return;
        const b = Math.min(len, 8), a = acc.get(b) || [1, 1];
        a[bet === x ? 0 : 1]++;
        acc.set(b, a);
      },
    });
  }

  const pop = makeAdaptive({ lr });
  experts.push({ name: 'population', p: () => pop.prob(), learn: x => pop.update(x) });

  const w = experts.map(e => (e.name === 'population' ? prior : 1));
  let ps = null, guess = null;

  function predict() {
    ps = experts.map(e => (e.last = e.p()));
    let num = 0, den = 0;
    for (let i = 0; i < ps.length; i++) { num += w[i] * ps[i]; den += w[i]; }
    const p = num / den;
    guess = Math.abs(p - 0.5) < 1e-9 ? (Math.random() < 0.5 ? 0 : 1) : Number(p > 0.5);
    return guess;
  }

  function update(x) {
    let tot = 0;
    for (let i = 0; i < w.length; i++) { w[i] *= x ? ps[i] : 1 - ps[i]; tot += w[i]; }
    for (let i = 0; i < w.length; i++) w[i] = (1 - alpha) * w[i] / tot + alpha / w.length;
    for (const e of experts) e.learn(x);
    hits.push(guess === x);
    run = seq.length && seq[seq.length - 1] === x ? run + 1 : 1;
    seq.push(x);
  }

  return { predict, update, experts, weights: w };
}

/* Runs a fresh oracle over a finished sequence; returns per-press hits. */
function oracleHits(seq) {
  const o = makeOracle();
  return seq.map(x => { const g = o.predict(); o.update(x); return g === x; });
}

/* Longest run of identical symbols, and the fraction of presses that switch. */
function seqStats(seq) {
  let run = 1, longest = seq.length ? 1 : 0, sw = 0;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === seq[i - 1]) longest = Math.max(longest, ++run);
    else { run = 1; sw++; }
  }
  return { longest, switchRate: seq.length > 1 ? sw / (seq.length - 1) : 0, ones: seq.filter(Boolean).length };
}

/* P(X >= k) for X ~ Binomial(n, 1/2). */
function binomTail(n, k) {
  let c = 1, sum = 0;                      // c = C(n, i)
  for (let i = 0; i <= n; i++) {
    if (i >= k) sum += c;
    c = c * (n - i) / (i + 1);
  }
  return sum / Math.pow(2, n);
}

const MODELS = { counters: makeBestCounter, oracle: () => makeOracle() };

if (typeof module !== 'undefined') module.exports = { makeOracle, makeBestCounter, oracleHits, seqStats, binomTail, MODELS };
