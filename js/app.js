'use strict';

(function () {
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const controls = $('controls');
  const nav = $('nav');
  const list = window.ILLUSIONS;

  // Collapsible nav groups; the default section starts open.
  const DEFAULT_SECTION = 'visual';
  const SECTIONS = { visual: ['Visual', 'Зрение'], mind: ['Разум', 'Разум'], ear: ['Слух', 'Слух'] };
  const LANG_KEY = 'lang';
  const LABELS = {
    en: { howto: 'How to view', expect: 'What happens', controls: 'Controls', why: 'Why it happens' },
    ru: { howto: 'Задание', expect: 'Что произошло', controls: 'Управление', why: 'Почему так' },
  };

  let current = -1;
  let cleanup = null;
  let mountId = 0;

  const sectionOf = il => il.section || DEFAULT_SECTION;
  const langOf = il => il.lang || window.LANG;
  const textOf = il => (!il.lang && window.LANG === 'ru' ? { ...il, ...il.ru } : il);
  const groups = {};
  const sectionNames = {};

  function group(key) {
    if (groups[key]) return groups[key];
    const count = list.filter(il => sectionOf(il) === key).length;
    const items = h('div', { className: 'nav-items' });
    sectionNames[key] = h('span');
    nav.append(h('details', { className: 'nav-group', open: key === DEFAULT_SECTION },
      h('summary', { className: 'stamp' }, sectionNames[key], h('span', { className: 'nav-count' }, count)),
      items));
    return groups[key] = items;
  }

  const buttons = list.map((il, i) => {
    const b = h('button', { type: 'button', className: 'nav-item', onclick: () => show(i) });
    group(sectionOf(il)).append(b);
    return b;
  });

  const langButtons = [...$('lang').querySelectorAll('button')];
  langButtons.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  function initialLang() {
    let saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (saved === 'en' || saved === 'ru') return saved;
    return (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  function renderChrome() {
    document.documentElement.lang = window.LANG;
    $('brand').textContent = tr('Illusions', 'Иллюзии');
    $('fullscreen-label').textContent = tr('Fullscreen', 'Во весь экран');
    $('fullscreen').title = tr('Fullscreen (F)', 'Во весь экран (F)');
    $('keys-or').textContent = tr('or', 'или');
    $('keys-switch').textContent = tr('switch', 'выбор');
    nav.setAttribute('aria-label', tr('Illusions', 'Иллюзии'));
    for (const key in sectionNames) sectionNames[key].textContent = tr(...SECTIONS[key]);
    buttons.forEach((b, i) => { b.innerHTML = `<span>${i + 1}</span>${textOf(list[i]).title}`; });
    langButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === window.LANG)));
    if (current >= 0) setDocumentTitle();
  }

  function setDocumentTitle() {
    document.title = `${textOf(list[current]).title} — ${tr('Illusions', 'Иллюзии')}`;
  }

  // Illusions fixed to one language keep running, so a demo in progress survives the switch.
  function setLang(lang) {
    if (lang === window.LANG) return;
    window.LANG = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    renderChrome();
    if (list[current].lang) return;
    const i = current;
    current = -1;
    show(i);
  }

  function show(i) {
    i = (i + list.length) % list.length;
    if (i === current) return;
    if (cleanup) cleanup();
    stage.replaceChildren();
    controls.replaceChildren();
    current = i;

    const il = list[i];
    const text = textOf(il);
    $('index').textContent = `${i + 1} / ${list.length}`;
    $('title').textContent = text.title;
    $('credit').textContent = text.credit;
    $('howto').textContent = text.howto;
    $('expect').textContent = text.expect;
    const lang = langOf(il);
    stage.lang = $('panel').lang = lang;
    for (const k in LABELS[lang]) $(k + '-h').textContent = LABELS[lang][k];
    // Gated illusions keep the outcome hidden until the module calls reveal().
    $('expect-wrap').hidden = $('why').hidden = !!il.gated;
    $('why').open = false;
    $('why-body').replaceChildren(...text.why.map(t => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    }));
    buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    buttons[i].closest('details').open = true;
    buttons[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    setDocumentTitle();

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
    else if (e.code === 'KeyF') toggleFullscreen();
  });

  window.LANG = initialLang();
  renderChrome();
  show(fromHash());
})();
