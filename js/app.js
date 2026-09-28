'use strict';

(function () {
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const controls = $('controls');
  const nav = $('nav');
  const list = window.ILLUSIONS;

  $('last-key').textContent = list.length;

  let current = -1;
  let cleanup = null;

  const buttons = list.map((il, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span>${i + 1}</span>${il.title}`;
    b.addEventListener('click', () => show(i));
    nav.appendChild(b);
    return b;
  });

  function show(i) {
    i = (i + list.length) % list.length;
    if (i === current) return;
    if (cleanup) cleanup();
    stage.replaceChildren();
    controls.replaceChildren();
    current = i;

    const il = list[i];
    $('index').textContent = `${i + 1} / ${list.length}`;
    $('title').textContent = il.title;
    $('credit').textContent = il.credit;
    $('howto').textContent = il.howto;
    $('expect').textContent = il.expect;
    $('why-body').replaceChildren(...il.why.map(t => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    }));
    buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    buttons[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    document.title = `${il.title} — Illusions`;

    cleanup = il.mount(stage, controls);
    $('controls-wrap').hidden = controls.childElementCount === 0;

    if (location.hash.slice(1) !== il.id) history.replaceState(null, '', '#' + il.id);
  }

  function fromHash() {
    const i = list.findIndex(il => il.id === location.hash.slice(1));
    return i < 0 ? 0 : i;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.requestFullscreen?.();
  }

  $('fullscreen').addEventListener('click', toggleFullscreen);
  window.addEventListener('hashchange', () => show(fromHash()));

  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;
    const inInput = e.target instanceof HTMLInputElement;
    if (e.key === 'ArrowRight' && !inInput) show(current + 1);
    else if (e.key === 'ArrowLeft' && !inInput) show(current - 1);
    else if (/^[1-9]$/.test(e.key) && Number(e.key) <= list.length) show(Number(e.key) - 1);
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  });

  show(fromHash());
})();
