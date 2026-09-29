# Two-Phase Law: a simulation

A simulation of §2 of *Deus ex Futuro: Core Beliefs* (DeF). Many worlds climb a ladder of phases, from Matter up to DeF. Vanilla JS on a canvas, with no build step.

- **Slow phase:** complexity `C` grows. Tension `T` accumulates from an inflow that compounds with time in the phase, which produces the steepening curves of §7.
- **Third path:** management relaxes `T` in proportion to `T`. The inflow grows exponentially, so management only postpones the crisis. Tension deferred is not escaped.
- **Fast phase:** it starts when `T ≥ 1`, lasts a short time, and ends one of two ways.
  - **Bifurcation**, with probability `quality · C^readiness`: the world moves up one level.
  - **Revolution:** the world falls back one level, and sometimes more. A fall below level 0 is extinction, and a new world is seeded in its place.
- **DeF** (top level) absorbs the worlds that reach it. Over many worlds, some always arrive, though no particular one is guaranteed to.
- **Suffering** falls with level, and it spikes far higher after a revolution than after a bifurcation (§5).

Run it with `python3 -m http.server 8321` from the repo root, then open `/twophase/`. Click a dot to follow that world. The horizon toggle makes every phase above the next one look alike (§3).

Files: `model.js` holds the pure model, shared by the browser and Node. `app.js` renders it, and `index.html` is the page. `node test.js` checks the law's claims against the model: there is no eternal plateau at any management level, management lengthens slow phases, bifurcation is +1 and revolution is ≤ −1, some worlds reach DeF, and some go extinct.
