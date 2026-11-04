'use strict';

/* Registry: each illusion script pushes a descriptor here.
   Descriptor: { id, title, credit, howto, expect, why: [paragraphs],
                 mount(stage, controls, { reveal }) -> cleanup() }
   Optional: section ('mind' | 'ear'; default is visual),
   lang ('ru': shown in that language only; otherwise it follows the switcher),
   ru ({ title, credit, howto, expect, why }: overrides for the Russian UI; credit may be omitted),
   gated (true: "expect" and "why" stay hidden until the module calls reveal()). */
window.ILLUSIONS = [];

/* UI language, 'en' or 'ru'. app.js sets it and remounts the illusion on a switch,
   so mount() can read strings through tr() once. */
window.LANG = 'en';

function tr(en, ru) {
  return window.LANG === 'ru' ? ru : en;
}

/* Fixed decimals with the UI language's separator: 0.40 / 0,40. */
function decimal(v, digits) {
  return v.toLocaleString(window.LANG, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/* HiDPI canvas that fills `host` and tracks its size.
   Drawing coordinates are CSS pixels; view.w / view.h are the current size. */
function createCanvas(host, onResize) {
  const canvas = document.createElement('canvas');
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const view = { canvas, ctx, w: 0, h: 0, dpr: 1 };

  function resize() {
    const r = host.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    if (w === view.w && h === view.h && dpr === view.dpr) return;
    Object.assign(view, { w, h, dpr });
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (onResize) onResize(view);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  view.destroy = () => { ro.disconnect(); canvas.remove(); };
  return view;
}

/* requestAnimationFrame loop. fn(timeSeconds, dtSeconds); dt is capped so a
   hidden tab doesn't produce a huge jump. Returns stop(). */
function animate(fn) {
  let id, last = performance.now();
  const start = last;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    fn((now - start) / 1000, dt);
    id = requestAnimationFrame(frame);
  }
  id = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(id);
}

/* Labelled range input appended to `parent`. */
function addSlider(parent, { label, min, max, step = 1, value, format = String, onInput }) {
  const wrap = document.createElement('div');
  wrap.className = 'control';
  const id = 'ctl-' + Math.random().toString(36).slice(2, 8);
  wrap.innerHTML =
    `<label for="${id}"><span>${label}</span><output></output></label>` +
    `<input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;
  const input = wrap.querySelector('input');
  const out = wrap.querySelector('output');
  const update = () => {
    const v = Number(input.value);
    out.textContent = format(v);
    onInput(v);
  };
  input.addEventListener('input', update);
  update();
  parent.appendChild(wrap);
  return input;
}

/* Labelled checkbox appended to `parent`. */
function addToggle(parent, { label, value, onChange }) {
  const wrap = document.createElement('label');
  wrap.className = 'control toggle';
  wrap.innerHTML = `<input type="checkbox"${value ? ' checked' : ''}><span>${label}</span>`;
  const input = wrap.querySelector('input');
  input.addEventListener('change', () => onChange(input.checked));
  onChange(value);
  parent.appendChild(wrap);
  return input;
}

/* Labelled text input appended to `parent`. */
function addText(parent, { label, value, maxLength = 40, onInput }) {
  const wrap = document.createElement('div');
  wrap.className = 'control';
  const id = 'ctl-' + Math.random().toString(36).slice(2, 8);
  wrap.innerHTML =
    `<label for="${id}"><span>${label}</span></label>` +
    `<input id="${id}" type="text" maxlength="${maxLength}" spellcheck="false" autocomplete="off">`;
  const input = wrap.querySelector('input');
  input.value = value;
  input.addEventListener('input', () => onInput(input.value));
  parent.appendChild(wrap);
  return input;
}

/* Button appended to `parent`. */
function addButton(parent, { label, onClick }) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'wr-btn wr-btn-quiet';
  b.textContent = label;
  b.addEventListener('click', onClick);
  parent.appendChild(b);
  return b;
}

/* Small overlay text on the stage. */
function addStatus(stage) {
  const el = document.createElement('div');
  el.className = 'stage-status';
  stage.appendChild(el);
  let current = null;
  return {
    set(text) { if (text !== current) { current = text; el.textContent = text; el.hidden = !text; } },
    remove() { el.remove(); },
  };
}

/* Deterministic PRNG (mulberry32) so procedural textures are stable. */
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* DOM builder: h('p', { className: 'x', onclick: fn }, 'text', childNode, ...).
   Null/false children are skipped; "on*" props become listeners. */
function h(tag, props, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(typeof c === 'object' ? c : String(c));
  }
  return node;
}

/* Theme colour from a Waking Room token, for drawing UI on a canvas: cssVar('--lamp'). */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* Sound for the Слух section. Browsers start audio only after a click, so the stage
   shows a start button until then; onStart(ctx, out) builds the graph into `out`.
   Adds Volume and Pause to `controls`. Pause suspends the context, so ctx.currentTime
   stops with it. destroy() fades out and closes the context.
   sound.ctx is null until the click. */
function createSound(stage, controls, { note, onStart }) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const sound = { ctx: null, out: null, paused: false };
  let volume = 0.4, master = null;
  const gain = v => 0.6 * v * v;   // perceptual taper, capped below full scale

  const btn = h('button', { type: 'button', className: 'wr-btn wr-btn-curtain', onclick: start }, tr('Listen', 'Слушать'));
  const gate = h('div', { className: 'sound-gate' }, btn, note && h('p', { className: 'sound-gate-note' }, note));
  if (!AC) {
    btn.disabled = true;
    gate.append(h('p', { className: 'sound-gate-note' }, tr('This browser has no Web Audio.', 'В этом браузере нет Web Audio.')));
  }
  stage.appendChild(gate);

  addSlider(controls, {
    label: tr('Volume', 'Громкость'), min: 0, max: 100, value: 40, format: v => v + ' %',
    onInput: v => {
      volume = v / 100;
      if (master) master.gain.setTargetAtTime(gain(volume), sound.ctx.currentTime, 0.05);
    },
  });
  addToggle(controls, {
    label: tr('Pause', 'Пауза'), value: false,
    onChange: v => {
      sound.paused = v;
      if (sound.ctx) v ? sound.ctx.suspend() : sound.ctx.resume();
    },
  });

  function start() {
    const ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    // Limiter: protects ears and speakers when several voices line up.
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -6;
    limit.knee.value = 0;
    limit.ratio.value = 20;
    limit.attack.value = 0.003;
    limit.release.value = 0.1;
    master.connect(limit).connect(ctx.destination);
    master.gain.setTargetAtTime(gain(volume), ctx.currentTime, 0.1);
    Object.assign(sound, { ctx, out: master });
    gate.remove();
    onStart(ctx, master);
    if (sound.paused) ctx.suspend(); else ctx.resume();
  }

  sound.destroy = () => {
    gate.remove();
    const ctx = sound.ctx;
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    setTimeout(() => ctx.close(), 150);
  };
  return sound;
}
