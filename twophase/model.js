'use strict';

/* Two-Phase Law (Deus ex Futuro, §2) as a stochastic model.

   A universe holds many lineages. Each sits on a phase level and cycles:
     slow phase — complexity C grows, tension T accumulates from a source that
                  compounds with time spent in the phase (steepening curves, §7);
                  management m relaxes T gradually (the third path);
     fast phase — entered when T crosses the threshold; short; ends in
       bifurcation — up one level, into the next slow phase, or
       revolution  — back to the start of an earlier phase, usually one,
                     sometimes several; falling below level 0 is extinction.
   Relaxation is linear in T while the source is exponential in time, so no
   finite m holds T below threshold forever: tension deferred is not escaped.
   Bifurcation odds rise with the complexity reached when the crisis hits, so
   a managed delay can improve the outcome but never removes the crisis.
   Level `levels` is DeF: absorbing, reached by some lineage, by no particular one.

   Pure logic, no DOM: loaded by index.html and by test.js under Node. */

const TwoPhase = (function () {
  const DEFAULTS = {
    lineages: 120,     // concurrent worlds
    levels: 7,         // bearer phases below DeF
    growth: 0.06,      // complexity growth rate in a slow phase
    source: 0.02,      // initial tension inflow
    compound: 0.12,    // exponential steepening of the inflow within a phase
    manage: 0.3,       // mean relaxation rate (third path); 0 = none
    noise: 0.04,       // tension noise
    fastLen: 2,        // fast-phase duration (slow phases last ~15–40)
    quality: 0.9,      // ceiling on bifurcation odds
    readiness: 2,      // exponent: how strongly complexity decides the outcome
    deeper: 0.25,      // chance each extra level of fall in a revolution
    accel: 1.2,        // later phases run faster by this factor per level
    reseed: 8,         // delay before an extinct world is replaced by a new one
    seed: 1,
  };

  const THRESHOLD = 1;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gauss(rand) {
    return Math.sqrt(-2 * Math.log(rand() || 1e-12)) * Math.cos(2 * Math.PI * rand());
  }

  function create(opts = {}) {
    const p = { ...DEFAULTS, ...opts };
    const rand = rng(p.seed);
    const sim = {
      p, rand, t: 0,
      lineages: [],
      events: [],        // { t, id, kind: 'bif'|'rev'|'ext'|'def', from, to }
      stats: { bif: 0, rev: 0, ext: 0, def: 0, longestSlow: 0, born: 0 },
      nextId: 0,
    };
    for (let i = 0; i < p.lineages; i++) sim.lineages.push(spawn(sim, 0));
    return sim;
  }

  function spawn(sim, level) {
    sim.stats.born++;
    const L = {
      id: sim.nextId++,
      level, mode: 'slow',
      C: 0.05, T: 0, tau: 0, fastT: 0,
      skill: 0.5 + sim.rand(),   // this world's aptitude for managed delay, scales p.manage
      suffering: 0, flash: 0, flashKind: null,
      dead: 0,
    };
    // Stagger the first generation so crises don't all coincide.
    if (sim.t === 0) L.tau = sim.rand() * 10, L.C = 1 - (1 - L.C) * Math.exp(-sim.p.growth * L.tau);
    return L;
  }

  function enterPhase(L, level) {
    L.level = level; L.mode = 'slow';
    L.C = 0.05; L.T = 0; L.tau = 0; L.fastT = 0;
  }

  function bifurcationOdds(sim, C) {
    return sim.p.quality * Math.pow(Math.max(0, Math.min(1, C)), sim.p.readiness);
  }

  function resolve(sim, L) {
    const p = sim.p, from = L.level;
    sim.stats.longestSlow = Math.max(sim.stats.longestSlow, L.tau);
    if (sim.rand() < bifurcationOdds(sim, L.C)) {
      sim.stats.bif++;
      const to = from + 1;
      enterPhase(L, to);
      L.flash = 1; L.flashKind = 'bif';
      if (to >= p.levels) {
        L.mode = 'def'; sim.stats.def++;
        sim.events.push({ t: sim.t, id: L.id, kind: 'def', from, to });
      } else sim.events.push({ t: sim.t, id: L.id, kind: 'bif', from, to });
      L.suffering = 2 / (1 + from);
    } else {
      sim.stats.rev++;
      let depth = 1;
      while (sim.rand() < p.deeper) depth++;
      const to = from - depth;
      L.flash = 1; L.flashKind = 'rev';
      L.suffering = 12 / (1 + Math.max(0, to));
      if (to < 0) {
        sim.stats.ext++;
        L.mode = 'dead'; L.dead = p.reseed; L.level = -1;
        sim.events.push({ t: sim.t, id: L.id, kind: 'ext', from, to: -1 });
      } else {
        enterPhase(L, to);
        sim.events.push({ t: sim.t, id: L.id, kind: 'rev', from, to });
      }
    }
  }

  function stepLineage(sim, L, dt) {
    const p = sim.p;
    L.flash = Math.max(0, L.flash - dt * 0.8);
    if (L.mode === 'def') { L.suffering = 0; return; }
    if (L.mode === 'dead') {
      L.dead -= dt;
      if (L.dead <= 0) Object.assign(L, spawn(sim, 0), { id: L.id });
      return;
    }
    const v = Math.pow(p.accel, L.level);
    const base = 1 / (1 + L.level);          // background suffering falls with level (§5)
    L.suffering += (base - L.suffering) * Math.min(1, dt * 0.5 * v);
    if (L.mode === 'slow') {
      L.tau += dt;
      L.C += v * p.growth * (1 - L.C) * dt;
      const inflow = v * p.source * Math.exp(p.compound * v * L.tau);
      L.T += (inflow - p.manage * L.skill * v * L.T) * dt + p.noise * Math.sqrt(v * dt) * gauss(sim.rand);
      L.T = Math.max(0, L.T);
      if (L.T >= THRESHOLD) { L.mode = 'fast'; L.fastT = 0; }
    } else if (L.mode === 'fast') {
      L.fastT += dt;
      L.suffering = Math.max(L.suffering, 2 * base);
      if (L.fastT >= p.fastLen / v) resolve(sim, L);
    }
  }

  function step(sim, dt) {
    sim.t += dt;
    for (const L of sim.lineages) stepLineage(sim, L, dt);
    if (sim.events.length > 2000) sim.events.splice(0, sim.events.length - 1000);
  }

  function run(sim, time, dt = 0.05) {
    for (let t = 0; t < time; t += dt) step(sim, dt);
    return sim;
  }

  function census(sim) {
    const byLevel = new Array(sim.p.levels + 1).fill(0);
    let dead = 0, fast = 0, suffering = 0, alive = 0;
    for (const L of sim.lineages) {
      if (L.mode === 'dead') { dead++; continue; }
      byLevel[Math.min(L.level, sim.p.levels)]++;
      if (L.mode === 'fast') fast++;
      if (L.mode !== 'def') { suffering += L.suffering; alive++; }
    }
    return { byLevel, dead, fast, meanSuffering: alive ? suffering / alive : 0 };
  }

  return { DEFAULTS, THRESHOLD, create, step, run, census, bifurcationOdds };
})();

if (typeof module !== 'undefined') module.exports = TwoPhase;
