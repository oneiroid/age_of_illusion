'use strict';

(function () {
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const controls = $('controls');
  const nav = $('nav');
  const list = window.ILLUSIONS;

  // Collapsible nav groups; the default section starts open.
  const DEFAULT_SECTION = 'visual';
  const SECTIONS = { visual: 'Visual', mind: 'Разум', ear: 'Слух' };
  const LABELS = {
    en: { howto: 'How to view', expect: 'What happens', controls: 'Controls', why: 'Why it happens' },
    ru: { howto: 'Задание', expect: 'Что произошло', controls: 'Управление', why: 'Почему так' },
  };

  let current = -1;
  let cleanup = null;
  let mountId = 0;

  const sectionOf = il => il.section || DEFAULT_SECTION;
  const groups = {};

  function group(key) {
    if (groups[key]) return groups[key];
    const count = list.filter(il => sectionOf(il) === key).length;
    const items = h('div', { className: 'nav-items' });
    nav.append(h('details', { className: 'nav-group', open: key === DEFAULT_SECTION },
      h('summary', { className: 'stamp' }, h('span', null, SECTIONS[key]), h('span', { className: 'nav-count' }, count)),
      items));
    return groups[key] = items;
  }

  const buttons = list.map((il, i) => {
    const b = h('button', { type: 'button', className: 'nav-item', onclick: () => show(i) });
    b.innerHTML = `<span>${i + 1}</span>${il.title}`;
    group(sectionOf(il)).append(b);
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
    const lang = il.lang || 'en';
    document.documentElement.lang = lang;
    for (const k in LABELS[lang]) $(k + '-h').textContent = LABELS[lang][k];
    // Gated illusions keep the outcome hidden until the module calls reveal().
    $('expect-wrap').hidden = $('why').hidden = !!il.gated;
    $('why').open = false;
    $('why-body').replaceChildren(...il.why.map(t => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    }));
    buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    buttons[i].closest('details').open = true;
    buttons[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    document.title = `${il.title} — Illusions`;

    const id = ++mountId;
    const reveal = () => {
      if (id === mountId) $('expect-wrap').hidden = $('why').hidden = false;
    };
    cleanup = il.mount(stage, controls, { reveal });
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
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;
    const inInput = e.target instanceof HTMLInputElement;
    if (e.key === 'ArrowRight' && !inInput) show(current + 1);
    else if (e.key === 'ArrowLeft' && !inInput) show(current - 1);
    else if (/^[1-9]$/.test(e.key) && Number(e.key) <= list.length) show(Number(e.key) - 1);
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  });

  show(fromHash());
})();
