'use strict';

(function () {
  const $ = id => document.getElementById(id);
  const NAMES = ['Matter', 'Chemistry', 'Cells', 'Plants', 'Animals', 'Humans', 'Successor'];
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const params = { ...TwoPhase.DEFAULTS };
  let speed = 4, paused = false, horizon = false;
  let sim, focusId, history, disp, lastSample = 0;

  function reset() {
    params.seed = (Math.random() * 1e9) | 0;
    sim = TwoPhase.create(params);
    focusId = sim.lineages[0].id;
    lastSample = 0;
    history = [];
    disp = new Map();
  }

  /* ---------- canvases ---------- */

  function canvas(host) {
    const c = document.createElement('canvas');
    host.appendChild(c);
    const v = { c, ctx: c.getContext('2d'), w: 0, h: 0 };
    new ResizeObserver(() => {
      const r = host.getBoundingClientRect(), dpr = devicePixelRatio || 1;
      v.w = r.width; v.h = r.height;
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      v.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }).observe(host);
    return v;
  }
  const ladder = canvas($('ladder'));
  const trace = canvas($('trace'));

  /* ---------- ladder ---------- */

  const LABEL_W = 96, FAST_W = 56, PAD = 12;

  function jitter(id) { const x = Math.sin(id * 12.9898) * 43758.5453; return x - Math.floor(x); }

  function rowGeom() {
    const rows = params.levels + 1;
    return { rows, rh: (ladder.h - 2 * PAD) / rows };
  }
  const rowY = (level, g) => PAD + (g.rows - 1 - level + 0.5) * g.rh;

  function target(L, g) {
    const x0 = LABEL_W, x1 = ladder.w - PAD - FAST_W;
    const jy = (jitter(L.id) - 0.5) * g.rh * 0.62;
    if (L.mode === 'def') {
      const k = L.id % 40;
      return { x: x0 + (x1 - x0 + FAST_W) * ((k + 0.5) / 40), y: rowY(params.levels, g) + jy };
    }
    if (L.mode === 'fast') return { x: x1 + FAST_W * (0.2 + 0.6 * jitter(L.id + 7)), y: rowY(L.level, g) + jy };
    return { x: x0 + (x1 - x0) * L.C, y: rowY(L.level, g) + jy };
  }

  function label(level, focus) {
    if (horizon && focus && focus.level >= 0 && focus.mode !== 'def') {
      const next = focus.level + 1;
      if (level > next) return (next >= params.levels ? 'DeF' : NAMES[next] || 'Phase ' + next) + ' ?';
    }
    return level >= params.levels ? 'DeF' : NAMES[level] || 'Phase ' + level;
  }

  function drawLadder() {
    const { ctx, w, h } = ladder, g = rowGeom();
    const muted = css('--muted'), grid = css('--grid'), accent = css('--accent');
    const bif = css('--bif'), rev = css('--rev'), text = css('--text');
    ctx.clearRect(0, 0, w, h);
    const focus = sim.lineages.find(L => L.id === focusId);

    ctx.font = '12px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    for (let lv = 0; lv < g.rows; lv++) {
      const y = rowY(lv, g);
      ctx.fillStyle = lv % 2 ? grid : 'transparent';
      ctx.fillRect(0, y - g.rh / 2, w, g.rh);
      ctx.fillStyle = lv === params.levels ? accent : (focus && lv === focus.level ? text : muted);
      ctx.fillText(label(lv, focus), PAD, y);
    }
    // fast-phase column
    const fx = w - PAD - FAST_W;
    ctx.fillStyle = grid;
    ctx.fillRect(fx, PAD, FAST_W, (g.rows - 1) * g.rh);
    ctx.fillStyle = muted;
    ctx.textAlign = 'center';
    ctx.fillText('fast', fx + FAST_W / 2, h - PAD / 2 - 1);
    ctx.fillText('complexity →', (LABEL_W + fx) / 2, h - PAD / 2 - 1);
    ctx.textAlign = 'left';

    const k = 0.15;
    for (const L of sim.lineages) {
      if (L.mode === 'dead') { disp.delete(L.id); continue; }
      const t = target(L, g);
      let d = disp.get(L.id);
      if (!d) disp.set(L.id, d = { ...t });
      d.x += (t.x - d.x) * k; d.y += (t.y - d.y) * k;

      const r = L.id === focusId ? 5 : 3.2;
      if (L.flash > 0) {
        ctx.globalAlpha = L.flash;
        ctx.fillStyle = L.flashKind === 'bif' ? bif : rev;
        ctx.beginPath(); ctx.arc(d.x, d.y, r + 10 * L.flash, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
      const heat = Math.min(1, L.T / TwoPhase.THRESHOLD);
      ctx.fillStyle = L.mode === 'def' ? accent : `hsl(${215 - 215 * heat} 75% 55%)`;
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 7); ctx.fill();
      if (L.mode === 'fast' || L.id === focusId) {
        ctx.strokeStyle = L.id === focusId ? text : muted;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(d.x, d.y, r + 3, 0, 7); ctx.stroke();
      }
    }
  }

  ladder.c.addEventListener('click', e => {
    const r = ladder.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = 400;
    for (const [id, d] of disp) {
      const dd = (d.x - x) ** 2 + (d.y - y) ** 2;
      if (dd < bd) { bd = dd; best = id; }
    }
    if (best != null && best !== focusId) { focusId = best; history = []; }
  });

  /* ---------- focus trace ---------- */

  const WINDOW = 120;

  function sample() {
    const L = sim.lineages.find(L => L.id === focusId);
    if (!L) return;
    history.push({ t: sim.t, T: L.mode === 'dead' ? 0 : L.T, C: L.mode === 'slow' || L.mode === 'fast' ? L.C : 0,
                   level: L.level, mode: L.mode, S: L.suffering });
    while (history.length && history[0].t < sim.t - WINDOW) history.shift();
  }

  function drawTrace() {
    const { ctx, w, h } = trace;
    const muted = css('--muted'), grid = css('--grid'), accent = css('--accent');
    const bif = css('--bif'), rev = css('--rev'), text = css('--text');
    ctx.clearRect(0, 0, w, h);
    const x0 = 44, x1 = w - 16, y0 = 26, y1 = h - 22;
    const X = t => x0 + (x1 - x0) * (1 - (sim.t - t) / WINDOW);
    const Tmax = 1.4;
    const Y = v => y1 - (y1 - y0) * Math.min(v, Tmax) / Tmax;
    const YL = lv => y1 - (y1 - y0) * (lv + 0.5) / (params.levels + 1);

    ctx.font = '12px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    const L = sim.lineages.find(L => L.id === focusId);
    ctx.fillStyle = text;
    ctx.fillText(`World #${focusId}: ${L ? stateText(L) : ''}`, x0, 16);

    // fast / dead shading
    for (let i = 1; i < history.length; i++) {
      const a = history[i - 1], b = history[i];
      if (a.mode === 'fast' || a.mode === 'dead') {
        ctx.fillStyle = a.mode === 'fast' ? 'rgba(229,62,62,.14)' : grid;
        ctx.fillRect(X(a.t), y0, X(b.t) - X(a.t) + 0.5, y1 - y0);
      }
    }
    // threshold
    ctx.strokeStyle = muted; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, Y(1)); ctx.lineTo(x1, Y(1)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = muted;
    ctx.fillText('threshold', x0 + 4, Y(1) - 4);
    ctx.fillText('1', x0 - 14, Y(1) + 4);
    ctx.fillText('0', x0 - 14, y1 + 4);

    const line = (get, color, width, dash) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.beginPath();
      history.forEach((s, i) => { const v = get(s); i ? ctx.lineTo(X(s.t), v) : ctx.moveTo(X(s.t), v); });
      ctx.stroke(); ctx.setLineDash([]);
    };
    line(s => YL(Math.max(-0.5, s.level)), accent, 1.5, [2, 3]);
    line(s => Y(s.C), muted, 1.5);
    line(s => Y(s.T), `hsl(10 80% 55%)`, 2);

    // event markers
    for (const e of sim.events) {
      if (e.id !== focusId || e.t < sim.t - WINDOW) continue;
      const up = e.kind === 'bif' || e.kind === 'def';
      ctx.fillStyle = up ? bif : rev;
      ctx.fillText(up ? '▲' : '▼', X(e.t) - 5, y0 + 10);
    }

    // legend
    const items = [['tension', 'hsl(10 80% 55%)'], ['complexity', muted], ['phase level', accent], ['fast phase', 'rgba(229,62,62,.5)']];
    let lx = x1;
    ctx.textAlign = 'right';
    for (const [name, col] of items.reverse()) {
      ctx.fillStyle = muted; ctx.fillText(name, lx, 16);
      lx -= ctx.measureText(name).width + 6;
      ctx.fillStyle = col; ctx.fillRect(lx - 10, 10, 10, 3);
      lx -= 22;
    }
    ctx.textAlign = 'left';
  }

  function stateText(L) {
    if (L.mode === 'dead') return 'extinct: fell past its origin. A new world will begin here.';
    if (L.mode === 'def') return 'reached DeF.';
    const name = NAMES[L.level] || 'Phase ' + L.level;
    return L.mode === 'fast'
      ? `${name}, in a fast phase (bifurcation odds ${(100 * TwoPhase.bifurcationOdds(sim, L.C)).toFixed(0)}%)`
      : `${name}, in a slow phase for ${L.tau.toFixed(1)}, with management ${(sim.p.manage * L.skill).toFixed(2)}`;
  }

  /* ---------- panel ---------- */

  function renderStats() {
    const c = TwoPhase.census(sim), s = sim.stats;
    const rows = [
      ['time', sim.t.toFixed(0)],
      ['worlds (living / extinct slots)', `${sim.lineages.length - c.dead} / ${c.dead}`],
      ['in a fast phase now', c.fast],
      ['bifurcations', s.bif],
      ['revolutions', s.rev],
      ['extinctions', s.ext],
      ['worlds ever born', s.born],
      ['reached DeF', s.def],
      ['longest slow phase', s.longestSlow.toFixed(1)],
      ['mean suffering', c.meanSuffering.toFixed(2)],
    ];
    $('stats').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  }

  function slider(label, key, min, max, step, fmt = v => v, onSet) {
    const wrap = document.createElement('div');
    wrap.className = 'control';
    const id = 'c-' + key;
    wrap.innerHTML = `<label for="${id}"><span>${label}</span><output></output></label>` +
      `<input id="${id}" type="range" min="${min}" max="${max}" step="${step}">`;
    const input = wrap.querySelector('input'), out = wrap.querySelector('output');
    input.value = key === 'speed' ? speed : params[key];
    const upd = () => {
      const v = Number(input.value);
      out.textContent = fmt(v);
      if (onSet) onSet(v);
      else { params[key] = v; if (sim) sim.p[key] = v; }
    };
    input.addEventListener('input', upd);
    upd();
    $('controls').appendChild(wrap);
  }

  slider('Speed (time / s)', 'speed', 0.5, 30, 0.5, v => v + '×', v => { speed = v; });
  slider('Management (third path)', 'manage', 0, 3, 0.05, v => v.toFixed(2));
  slider('Tension compounding', 'compound', 0.04, 0.3, 0.01, v => v.toFixed(2));
  slider('Readiness weight', 'readiness', 0.5, 5, 0.1, v => v.toFixed(1));
  slider('Bifurcation ceiling', 'quality', 0.3, 1, 0.01, v => (100 * v).toFixed(0) + '%');
  slider('Chance of a deeper fall', 'deeper', 0, 0.7, 0.01, v => (100 * v).toFixed(0) + '%');
  slider('Worlds (new universe)', 'lineages', 20, 400, 10, v => v, v => { params.lineages = v; });

  $('horizon').addEventListener('change', e => { horizon = e.target.checked; });
  $('pause').addEventListener('click', e => { paused = !paused; e.target.textContent = paused ? 'Resume' : 'Pause'; });
  $('reset').addEventListener('click', reset);
  document.addEventListener('keydown', e => {
    if (e.key === ' ' && e.target === document.body) { e.preventDefault(); $('pause').click(); }
  });

  /* ---------- loop ---------- */

  reset();
  let last = performance.now(), acc = 0, statsT = 0;
  const DT = 0.05;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) {
      acc += dt * speed;
      let n = 0;
      while (acc >= DT && n++ < 2000) { TwoPhase.step(sim, DT); acc -= DT;
        if (sim.t - lastSample >= 0.1) { lastSample = sim.t; sample(); } }
    }
    drawLadder();
    drawTrace();
    if ((statsT += dt) > 0.25) { statsT = 0; renderStats(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
