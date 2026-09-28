'use strict';

/* Registry: each illusion script pushes a descriptor here.
   Descriptor: { id, title, credit, howto, expect, why: [paragraphs],
                 mount(stage, controls) -> cleanup() } */
window.ILLUSIONS = [];

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
