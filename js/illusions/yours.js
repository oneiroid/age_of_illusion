'use strict';

ILLUSIONS.push({
  id: 'for-your-eyes-only',
  gated: true,
  title: 'For Your Eyes Only',
  credit: 'New design for this app, 2026 · flicker photometry (Ives, 1912); individual cone ratios (Hofer et al., 2005)',
  howto: 'Red and green flicker at about 30 Hz; Space or a tap pauses it. If the flicker never disappears anywhere on the slider, change Frames per colour or lower Contrast. First you find the setting at which the flicker disappears for your eyes, which takes about two minutes. The setting belongs to your eyes and this screen: redo it on another monitor, or after changing the colour profile or turning Night Shift, True Tone or night light on or off. Sit at your usual distance. It is better with a second person nearby.',
  expect: 'At your own setting the word disappeared into an even colour, though it is in every frame: the frozen frame, a screenshot or a camera shows it plainly. Someone whose eyes weigh red and green differently sees the letters shimmer. In the second mode it is the other way round: for your eyes the letters are the only still cells; for anyone else they are lost among cells that happen to be still for them.',
  why: [
    'Two frames alternate about 30 times a second: one screen refresh each on a 60 Hz screen. Inside the letters one frame is reddish and the other greenish. The background is a fine checkerboard of the same two colours swapping places, so every pixel goes through the same changes and the time average is the same everywhere. Colour vision cannot follow red–green alternation this fast and fuses it into the average; brightness vision can, up to about 50–60 Hz. So if the reddish and the greenish frame are equally bright for you, nothing is left to see. At 15 Hz saturated red and green still flicker visibly as colour, so no balance stills them; classic flicker photometry uses paler lights.',
    'The calibration found that balance. It is heterochromatic flicker photometry, the method behind the luminance curve V(λ) of 1924, and so behind the weights your screen uses for brightness, Y = 0.2126 R + 0.7152 G + 0.0722 B. The balance is personal: people with normal colour vision differ several-fold in the ratio of L to M cones (Hofer et al., 2005), and the setting where flicker disappears varies between people about five times more than between repeated settings by one person (He et al., 2021). For someone 10% away from you the letters flicker at about 5% contrast. Red swings over the whole range of the screen and there is no blue, which makes that flicker as large as the screen allows; Contrast in the controls turns it down.',
    'Each frame on its own contains the word in plain colour, which is why a screenshot or a camera with a short exposure shows it. It is the inverse of Ghost Word, where the word is in no frame and exists only in motion.',
    'In the second mode every cell alternates between two colours. In the background the red and green amplitudes of a cell differ by 8 or 16%; in the letters they are equal. For your eyes the letters are the only still cells. For someone else other, scattered cells are still, and the letters flicker about as much as the background. In a model observer the letters stop standing out once two people differ by about 10%, while someone within 2% of you sees them as well as you do. Red and green levels are distributed alike inside and outside the letters, but the cipher only resists eyes: a computer comparing two consecutive frames reads it at once.',
    'This is a new design, not a replication. It depends on the screen keeping a steady frame rate (a dropped frame is a brief flash of brightness that everyone sees; the count is in the corner), on how the display handles rapid changes, and on how far apart two people’s settings are. lab/flicker-probe.html measures a screen’s frame timing. The setting is the balance of this screen’s red and green for your eyes, so it changes with the monitor and its colour profile; the percentages against the standard observer assume that the screen shows sRGB colours accurately.',
  ],

  mount(stage, controls, { reveal }) {
    const N_CAL = 6, MORE = 4, MAX_PCT = 3, TRIES = 3;
    const CELL = 10;                         // cells-mode cell, CSS px
    const SAVE = 'fyeo-keys';                // saved settings, one per screen
    const LOG_MIN = Math.log10(FY.K_MIN), LOG_MAX = Math.log10(FY.K_MAX), LOG_STD = Math.log10(FY.STD_K);
    const rand = Math.random;

    const root = h('div', { className: 'fy' });
    const view = h('div', { className: 'fy-view' });
    const bar = h('div', { className: 'fy-bar' });
    root.append(view, bar);
    stage.appendChild(root);
    const cvs = { rest: h('canvas'), a: h('canvas'), b: h('canvas') };
    view.append(cvs.rest, cvs.a, cvs.b);
    const status = addStatus(view);

    // Dither table: per-pixel random rounding keeps 8-bit steps from limiting the null.
    // Uint8ClampedArray rounds to nearest, so the offsets are centred on zero.
    const DITHER = new Float32Array(65536);
    { const r = rng(7); for (let i = 0; i < DITHER.length; i++) DITHER[i] = r() - 0.5; }

    let W = 0, H = 0, scene = null, dirty = false;
    let paused = false, shown = null;       // paused shows the fused image, or frame A in 'frame'
    let contrast = 1, userHalf = false, halfInput = null;
    let raf, last = 0, frames = 0, drops = 0;
    const intervals = [];
    let period = 1000 / 60, half = 2;

    let phase, keys, cal, used, words, answers, tries, stdKey;

    // Canvases at device-pixel resolution: any rescaling would blend the background
    // checkerboard in gamma-encoded values and shift its colour away from the letters'.
    let dpr = 1;
    const ro = new ResizeObserver(() => {
      const r = view.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(r.width * dpr)), hh = Math.max(1, Math.round(r.height * dpr));
      if (w === W && hh === H) return;
      W = w; H = hh;
      for (const c of Object.values(cvs)) { c.width = W; c.height = H; }
      dirty = true;
    });
    ro.observe(view);

    /* ---------- painting ---------- */

    // Shape at pixel resolution: a disc for calibration, the word otherwise.
    function shapeMask() {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      if (scene.kind === 'patch') {
        g.beginPath();
        g.arc(W / 2, H / 2, Math.min(W, H) * 0.16, 0, Math.PI * 2);
        g.fill();
      } else {
        const font = size => `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
        let size = H * 0.42;
        g.font = font(size);
        const tw = g.measureText(scene.word).width;
        if (tw > W * 0.86) size *= (W * 0.86) / tw;
        g.font = font(size);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(scene.word, W / 2, H / 2);
      }
      const a = g.getImageData(0, 0, W, H).data;
      const m = new Uint8Array(W * H);
      for (let i = 0; i < m.length; i++) m[i] = a[i * 4 + 3] > 127 ? 1 : 0;
      return m;
    }

    const enc = c => c.map(v => fyEncode(v) * 255);

    // One colour, dithered, as 16384 RGBA pixels; pixel i of an image takes entry i & 16383.
    function tile(e, off) {
      const t = new Uint8ClampedArray(65536);
      for (let q = 0; q < 65536; q++) t[q] = (q & 3) === 3 ? 255 : e[q & 3] + DITHER[(q + off) & 65535];
      return new Uint32Array(t.buffer);
    }

    /* Three images. rest: a static checkerboard of the two colours (what the flicker
       fuses to). a / b: the two frames. In 'patch' and 'word' the shape alternates as a
       whole while the background checkerboard swaps colours pixel by pixel; in 'cells'
       every cell alternates between its own two colours. */
    function paint() {
      dirty = false;
      if (!scene || W < 2) return;
      const imgs = ['rest', 'a', 'b'].map(n => cvs[n].getContext('2d').createImageData(W, H));
      const mask = shapeMask();

      if (scene.kind !== 'cells') {
        const { A, B } = fyPair(scene.k, 1, 1, contrast);
        const eA = enc(A), eB = enc(B);
        const [rA, rB, aA, aB, bA, bB] = [[eA, 0], [eB, 0], [eA, 21845], [eB, 21845], [eA, 43690], [eB, 43690]]
          .map(([e, off]) => tile(e, off));
        const [dr, da, db] = imgs.map(im => new Uint32Array(im.data.buffer));
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x, t = i & 16383, p = (x + y) & 1, m = mask[i];
          dr[i] = p ? rA[t] : rB[t];
          da[i] = m || p ? aA[t] : aB[t];
          db[i] = m || p ? bB[t] : bA[t];
        }
      } else {
        const [dr, da, db] = imgs.map(im => im.data);
        const put = (d, j, e, off) => {
          d[j] = e[0] + DITHER[(j + off) & 65535];
          d[j + 1] = e[1] + DITHER[(j + 1 + off) & 65535];
          d[j + 2] = e[2] + DITHER[(j + 2 + off) & 65535];
          d[j + 3] = 255;
        };
        const cp = Math.max(4, Math.round(CELL * dpr));
        const gw = Math.ceil(W / cp), gh = Math.ceil(H / cp);
        const cm = new Uint8Array(gw * gh);
        for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
          const x = Math.min(W - 1, Math.floor((cx + 0.5) * cp)), y = Math.min(H - 1, Math.floor((cy + 0.5) * cp));
          cm[cy * gw + cx] = mask[y * W + x];
        }
        const cells = fyCells(cm, rng(scene.seed));
        const cA = cells.map(c => {
          const { A, B } = fyPair(scene.k, fyLevel(c.a), fyLevel(c.b), contrast);
          return c.phase > 0 ? [enc(A), enc(B)] : [enc(B), enc(A)];
        });
        for (let y = 0; y < H; y++) {
          const row = Math.floor(y / cp) * gw;
          for (let x = 0; x < W; x++) {
            const [eA, eB] = cA[row + Math.floor(x / cp)];
            const j = (y * W + x) * 4;
            put(dr, j, (x + y) & 1 ? eA : eB, 0);
            put(da, j, eA, 21845);
            put(db, j, eB, 43690);
          }
        }
      }
      ['rest', 'a', 'b'].forEach((n, k) => cvs[n].getContext('2d').putImageData(imgs[k], 0, 0));
    }

    /* ---------- frame loop ---------- */

    function tick(now) {
      raf = requestAnimationFrame(tick);
      const dt = last ? now - last : 0;
      last = now;
      if (dt > 0 && intervals.length < 90) {
        intervals.push(dt);
        if (intervals.length === 90) {
          const s = intervals.slice(30).sort((x, y) => x - y);
          period = s[s.length >> 1];
          if (!userHalf) {
            half = Math.max(1, Math.round(1000 / period / 60));
            halfInput.value = half;
            halfInput.dispatchEvent(new Event('input'));
          }
        }
      }
      if (dirty) paint();

      let which = phase === 'frame' ? 'a' : 'rest';
      if (!paused && scene) {
        if (dt > period * 1.5) drops++;
        if (cal && phase === 'cal') cal.held += dt;
        frames++;
        which = Math.floor(frames / half) & 1 ? 'b' : 'a';
        const hz = 1000 / period;
        status.set(`${Math.round(hz / (2 * half))} Hz flicker · ${Math.round(hz)} Hz screen · ${drops} dropped frame${drops === 1 ? '' : 's'}`);
        if (phase === 'cal') syncCal();
      } else {
        status.set('');
      }
      if (which !== shown) {
        for (const n in cvs) cvs[n].style.visibility = n === which ? 'visible' : 'hidden';
        shown = which;
      }
    }
    raf = requestAnimationFrame(tick);

    /* ---------- input ---------- */

    function setPaused(v) {
      paused = v;
      root.querySelectorAll('.fy-play').forEach(b => {
        b.classList.toggle('on', paused);
        b.firstChild.textContent = paused ? 'Play ' : 'Pause ';
      });
    }
    view.addEventListener('click', () => setPaused(!paused));

    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const typing = e.target instanceof HTMLInputElement && e.target.type === 'text';
      if (e.code === 'Space' && !typing) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'keydown' && !e.repeat) setPaused(!paused);
        return;
      }
      if (e.type !== 'keydown' || typing || phase !== 'cal') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        const slider = bar.querySelector('.fy-slider');
        if (!slider) return;
        const step = e.shiftKey ? 25 : 4;
        slider.value = Number(slider.value) + (e.key === 'ArrowRight' ? step : -step);
        slider.dispatchEvent(new Event('input'));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        bar.querySelector('.fy-confirm:not(:disabled)')?.click();
      }
    }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);

    /* ---------- flow ---------- */

    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const pct = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%';
    const vsStd = k => (k / FY.STD_K - 1) * 100;
    const playBtn = '<button type="button" class="btn fy-play">Pause <kbd>Space</kbd></button>';

    function setBar(html) {
      bar.innerHTML = html;
      bar.querySelectorAll('.fy-play').forEach(b => b.addEventListener('click', () => setPaused(!paused)));
      setPaused(paused);
      if (document.activeElement && document.activeElement !== document.body && !bar.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    }

    // A setting only holds for the screen it was made on; this is as close as a page
    // gets to naming that screen.
    const screenId = () => `${screen.width}×${screen.height} @${window.devicePixelRatio || 1}x ` +
      (matchMedia('(color-gamut: p3)').matches ? 'wide gamut' : 'sRGB');
    function readSaved() {
      try {
        const s = (JSON.parse(localStorage.getItem(SAVE)) || {})[screenId()];
        return s && s.k >= FY.K_MIN && s.k <= FY.K_MAX ? s : null;
      } catch (e) { return null; }
    }
    function save(key) {
      try {
        const all = JSON.parse(localStorage.getItem(SAVE)) || {};
        all[screenId()] = { k: key.k, pct: key.pct, t: Date.now() };
        localStorage.setItem(SAVE, JSON.stringify(all));
      } catch (e) { /* storage unavailable */ }
    }

    function start() {
      paused = false;
      keys = { you: null, friend: null };
      cal = null;
      used = [];
      words = {};
      answers = {};
      stdKey = false;
      scene = null;
      phase = 'intro';
      for (const c of Object.values(cvs)) c.getContext('2d').clearRect(0, 0, c.width, c.height);
      render();
    }

    function render() {
      ({ intro: renderIntro, cal: renderCal, calcheck: renderCalCheck, see: renderSee, frame: renderFrame,
        only: renderOnly, swap: renderSwap, end: renderEnd })[phase]();
    }

    function newWord(slot) {
      words[slot] = fyWord(used, rand);
      used.push(words[slot]);
      return words[slot];
    }

    function setScene(s) { scene = s; dirty = true; }

    function renderIntro() {
      const saved = readSaved();
      setBar(
        `<p class="mind-step">For your eyes only</p>
         <p class="fy-big">First, find the setting at which flicker disappears for your eyes.</p>
         <p class="mind-sub">A disc flickers red and green. Move the slider until the flicker is weakest, six times over. The setting belongs to your eyes and this screen (${screenId()}): redo it on another monitor, or after changing the colour profile or a night mode.</p>
         <div class="fy-row">
           <button type="button" class="btn btn-primary fy-go">Start calibration</button>
           ${saved ? `<button type="button" class="btn fy-saved">Use the setting saved on this screen (${new Date(saved.t).toLocaleDateString()})</button>` : ''}
         </div>`);
      bar.querySelector('.fy-go').addEventListener('click', () => startCal('you'));
      bar.querySelector('.fy-saved')?.addEventListener('click', () => {
        keys.you = { k: saved.k, pct: saved.pct, saved: true };
        toSee();
      });
    }

    /* Calibration: each setting starts on a random side of the standard observer's
       null, and the slider runs in a random direction, so positions can't be repeated. */
    function startCal(who) {
      cal = { who, logs: [], n: N_CAL };
      nextTrial();
    }

    function nextTrial() {
      const t = cal.logs.length;
      const side = t % 2 ? 1 : -1;
      cal.logk = Math.min(LOG_MAX, Math.max(LOG_MIN, LOG_STD + side * (0.08 + rand() * 0.1)));
      cal.flip = rand() < 0.5;
      cal.held = 0;
      setScene({ kind: 'patch', k: 10 ** cal.logk });
      paused = false;
      phase = 'cal';
      render();
    }

    const toSlider = lk => Math.round(((lk - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);
    const fromSlider = v => LOG_MIN + ((cal.flip ? 1000 - v : v) / 1000) * (LOG_MAX - LOG_MIN);

    function renderCal() {
      const t = cal.logs.length;
      const v = toSlider(cal.logk);
      setBar(
        `<p class="mind-step">Calibration${cal.who === 'friend' ? ' for your friend' : ''} · setting ${t + 1} of ${cal.n}</p>
         <p class="mind-sub">Look at the middle of the disc and move the slider (or <kbd>←</kbd> <kbd>→</kbd>, with Shift for big steps) until the flicker is weakest. The colour doesn’t matter, only the shimmer. At the right point the disc may vanish altogether. If no point stops the flicker, try another Frames per colour or a lower Contrast in the controls.</p>
         <div class="fy-row">
           ${playBtn}
           <input class="fy-slider" type="range" min="0" max="1000" step="1" value="${cal.flip ? 1000 - v : v}" aria-label="Red–green balance">
           <button type="button" class="btn btn-primary fy-confirm" disabled>Weakest here <kbd>Enter</kbd></button>
         </div>`);
      const slider = bar.querySelector('.fy-slider');
      slider.addEventListener('input', () => {
        cal.logk = fromSlider(Number(slider.value));
        setScene({ kind: 'patch', k: 10 ** cal.logk });
      });
      bar.querySelector('.fy-confirm').addEventListener('click', () => {
        cal.logs.push(cal.logk);
        if (cal.logs.length < cal.n) return nextTrial();
        const est = fyEstimate(cal.logs);
        if (est.pct > MAX_PCT && cal.n === N_CAL) { phase = 'calcheck'; return render(); }
        finishCal(est);
      });
    }

    // The confirm button opens once the current setting has been looked at for a second.
    function syncCal() {
      const b = bar.querySelector('.fy-confirm');
      if (b && b.disabled && cal.held > 1000) b.disabled = false;
    }

    function renderCalCheck() {
      const est = fyEstimate(cal.logs);
      setBar(
        `<p class="mind-step">Calibration</p>
         <p class="fy-big">Your settings vary by ±${est.pct.toFixed(1)}%.</p>
         <p class="mind-sub">The trick works best within about ±2%. Four more settings usually settle it.</p>
         <div class="fy-row">
           <button type="button" class="btn btn-primary fy-more">Four more</button>
           <button type="button" class="btn fy-on">Continue anyway</button>
         </div>`);
      bar.querySelector('.fy-more').addEventListener('click', () => { cal.n += MORE; nextTrial(); });
      bar.querySelector('.fy-on').addEventListener('click', () => finishCal(est));
    }

    function finishCal(est) {
      keys[cal.who] = est;
      if (cal.who === 'you') { save(est); toSee(); }
      else toSwap();
    }

    function toSee() {
      setScene({ kind: 'word', k: keys.you.k, word: newWord('see') });
      paused = false;
      phase = 'see';
      render();
    }

    function renderSee() {
      setBar(
        `<p class="mind-step">1 · Look</p>
         <p class="fy-big">Look at the screen. What do you see?</p>
         <p class="mind-sub">Look anywhere; take your time.</p>
         <div class="fy-row">
           ${playBtn}
           <button type="button" class="btn fy-ans" data-a="nothing">An even colour</button>
           <button type="button" class="btn fy-ans" data-a="shimmer">Something shimmers</button>
           <button type="button" class="btn fy-ans" data-a="read">I can read a word</button>
         </div>
         <div class="fy-row fy-read" hidden>
           <input class="fy-input" type="text" maxlength="12" spellcheck="false" autocomplete="off" placeholder="the word">
           <button type="button" class="btn btn-primary fy-send">Done</button>
         </div>`);
      bar.querySelectorAll('.fy-ans').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.a !== 'read') { answers.see = { a: b.dataset.a }; return toFrame(); }
        bar.querySelector('.fy-read').hidden = false;
        bar.querySelector('.fy-input').focus();
      }));
      const input = bar.querySelector('.fy-input');
      const send = () => { answers.see = { a: 'read', text: input.value.trim().toUpperCase() }; toFrame(); };
      bar.querySelector('.fy-send').addEventListener('click', send);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    }

    function toFrame() {
      paused = true;
      phase = 'frame';
      reveal();
      render();
    }

    function seeSummary() {
      const s = answers.see;
      if (s.a === 'nothing') return 'You saw an even colour.';
      if (s.a === 'shimmer') return 'You saw something shimmer, so your setting is a little off, or the screen dropped frames.';
      return s.text === words.see
        ? 'You read it: your setting is off, or the screen leaks the word.'
        : `You read “${esc(s.text)}”.`;
    }

    function renderFrame() {
      setBar(
        `<p class="mind-step">2 · One frame</p>
         <p class="fy-big">This is a single frame of what was on the screen.</p>
         <p class="mind-sub">${seeSummary()} The word is in every frame; a screenshot captures it, and so may a phone camera with a short exposure. Averaged over time with your eyes’ balance of red and green, it is an even colour.</p>
         <p class="mind-sub">Press Play and show someone next to you: do they see the letters shimmer?${stdKey
           ? ' Now keyed to the standard observer behind sRGB, ' + pct((FY.STD_K / keys.you.k - 1) * 100) + ' from your setting: if that gap is more than a few percent, you see the letters too.'
           : ''}</p>
         <div class="fy-row">
           ${playBtn}
           <button type="button" class="btn fy-key">${stdKey ? 'Key it to my eyes' : 'Key it to the standard observer'}</button>
           <button type="button" class="btn btn-primary fy-next">Next: the opposite</button>
         </div>`);
      bar.querySelector('.fy-key').addEventListener('click', () => {
        stdKey = !stdKey;
        setScene({ ...scene, k: stdKey ? FY.STD_K : keys.you.k });
        render();
      });
      bar.querySelector('.fy-next').addEventListener('click', () => {
        paused = false;
        setScene({ kind: 'cells', k: keys.you.k, word: newWord('only'), seed: 1 + Math.floor(rand() * 1e9) });
        tries = 0;
        phase = 'only';
        render();
      });
    }

    /* A guess form: up to `max` tries; done(ok, tries) after a hit or the last miss. */
    function guessForm(sel, word, max, done) {
      const form = bar.querySelector(sel);
      const input = form.querySelector('.fy-input');
      const msg = form.querySelector('.fy-msg');
      let n = 0;
      const check = () => {
        const g = input.value.trim().toUpperCase();
        if (!g) return;
        n++;
        if (g === word) return done(true, n);
        if (n >= max) return done(false, n);
        msg.textContent = `Not “${g}”. ${max - n} ${max - n === 1 ? 'try' : 'tries'} left.`;
        input.select();
      };
      form.querySelector('.fy-check').addEventListener('click', check);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    }

    const formHtml = (cls, label) =>
      `<div class="fy-row ${cls}">
         <span class="fy-label">${label}</span>
         <input class="fy-input" type="text" maxlength="12" spellcheck="false" autocomplete="off">
         <button type="button" class="btn btn-primary fy-check">Check</button>
         <span class="fy-msg"></span>
       </div>`;

    // word: null keeps a missed word hidden while someone else still has to read it.
    const verdict = (r, word) => (r.ok
      ? `<span class="fy-ok">Read it${r.n > 1 ? ` on try ${r.n}` : ''}.</span>`
      : `<span class="fy-bad">Missed${word ? `; it was ${word}` : ''}.</span>`);

    function renderOnly() {
      const you = answers.only, friend = answers.onlyFriend;
      let tail;
      if (!you) {
        tail = formHtml('fy-you', 'You read:');
      } else if (!friend) {
        tail =
          `<p class="mind-sub">${you.ok ? 'Don’t say the word. ' : ''}Now ask someone who hasn’t calibrated to read it.</p>
           ${formHtml('fy-friend', 'They read:')}
           <div class="fy-row"><button type="button" class="btn fy-skip">No one around: finish</button></div>`;
      } else {
        tail =
          `<p class="mind-sub">You: ${verdict(you, words.only)} Them: ${verdict(friend, words.only)}</p>
           <div class="fy-row">
             <button type="button" class="btn btn-primary fy-fcal">Let them calibrate</button>
             <button type="button" class="btn fy-skip">Finish</button>
           </div>`;
      }
      setBar(
        `<p class="mind-step">3 · Only for you</p>
         <p class="fy-big">Every cell flickers, except those of a word that is still only for your eyes.</p>
         <p class="mind-sub">Look for the still letters.${you ? ' Your result: ' + verdict(you, friend ? words.only : null) : ''}</p>
         <div class="fy-row">${playBtn}</div>
         ${tail}`);
      if (!you) guessForm('.fy-you', words.only, TRIES, (ok, n) => { answers.only = { ok, n }; render(); });
      else if (!friend) guessForm('.fy-friend', words.only, TRIES, (ok, n) => { answers.onlyFriend = { ok, n }; render(); });
      bar.querySelector('.fy-skip')?.addEventListener('click', () => { phase = 'end'; render(); });
      bar.querySelector('.fy-fcal')?.addEventListener('click', () => startCal('friend'));
    }

    function toSwap() {
      paused = false;
      setScene({ kind: 'cells', k: keys.friend.k, word: newWord('swap'), seed: 1 + Math.floor(rand() * 1e9) });
      phase = 'swap';
      render();
    }

    function renderSwap() {
      const friend = answers.swapFriend, you = answers.swap;
      let tail;
      if (!friend) tail = formHtml('fy-friend', 'They read:');
      else if (!you) tail = `<p class="mind-sub">Them: ${friend.ok ? '<span class="fy-ok">read it.</span> Now you try, without being told.' : '<span class="fy-bad">missed.</span> Now you try.'}</p>${formHtml('fy-you', 'You read:')}`;
      else tail = `<p class="mind-sub">Them: ${verdict(friend, words.swap)} You: ${verdict(you, words.swap)}</p>
                   <div class="fy-row"><button type="button" class="btn btn-primary fy-end">Results</button></div>`;
      setBar(
        `<p class="mind-step">4 · Swapped</p>
         <p class="fy-big">Now the word is keyed to your friend’s eyes.</p>
         <p class="mind-sub">They read first; then you.</p>
         <div class="fy-row">${playBtn}</div>
         ${tail}`);
      if (!friend) guessForm('.fy-friend', words.swap, TRIES, (ok, n) => { answers.swapFriend = { ok, n }; render(); });
      else if (!you) guessForm('.fy-you', words.swap, TRIES, (ok, n) => { answers.swap = { ok, n }; render(); });
      bar.querySelector('.fy-end')?.addEventListener('click', () => { phase = 'end'; render(); });
    }

    function renderEnd() {
      setScene(null);
      for (const c of Object.values(cvs)) c.getContext('2d').clearRect(0, 0, c.width, c.height);
      const y = keys.you, f = keys.friend;
      const rows = [
        ['Your setting vs the standard observer', pct(vsStd(y.k))],
        ['Your setting noise', y.saved ? 'saved setting' : '±' + y.pct.toFixed(1) + '%'],
      ];
      if (f) {
        const gap = (f.k / y.k - 1) * 100;
        rows.push(['Your friend vs the standard observer', pct(vsStd(f.k))],
          ['Your friend’s setting noise', '±' + f.pct.toFixed(1) + '%'],
          ['Gap between your eyes', pct(gap)],
          ['Letters’ flicker for your friend in the first word (model)', (fyContrast(f.k, y.k) * 100).toFixed(1) + '% contrast']);
      }
      const res = [];
      if (answers.only) res.push(['Only for you: you', verdict(answers.only, words.only)]);
      if (answers.onlyFriend) res.push(['Only for you: your friend', verdict(answers.onlyFriend, words.only)]);
      if (answers.swapFriend) res.push(['Keyed to your friend: they', verdict(answers.swapFriend, words.swap)]);
      if (answers.swap) res.push(['Keyed to your friend: you', verdict(answers.swap, words.swap)]);
      const table = r => `<table class="mind-table fy-table">${r.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`;
      setBar(
        `<p class="mind-step">Results</p>
         <p class="fy-big">Your eyes weigh this red ${vsStd(y.k) >= 0 ? 'more' : 'less'} than the standard observer does, by ${Math.abs(vsStd(y.k)).toFixed(0)}%.</p>
         <p class="mind-sub">Relative to green, assuming the screen shows sRGB colours accurately. Strong shifts can come with colour-vision anomalies; this is not a test for them.</p>
         ${table(rows)}
         ${res.length ? table(res) : ''}
         <p class="mind-note">${drops} dropped frame${drops === 1 ? '' : 's'} while flickering. Each one is a brief flash of brightness everyone can see.</p>
         <div class="fy-row"><button type="button" class="btn btn-primary fy-again">Start over</button></div>`);
      bar.querySelector('.fy-again').addEventListener('click', start);
    }

    addSlider(controls, {
      label: 'Contrast', min: 20, max: 100, step: 5, value: 100,
      format: v => v + '%',
      onInput: v => { contrast = v / 100; dirty = true; },
    });
    // Set from the measured refresh rate until the user moves it.
    halfInput = addSlider(controls, {
      label: 'Frames per colour', min: 1, max: 6, value: half,
      format: v => `${v} · ${Math.round(1000 / period / (2 * v))} Hz`,
      onInput: v => { half = v; },
    });
    halfInput.addEventListener('input', e => { if (e.isTrusted) userHalf = true; });
    addButton(controls, { label: 'Start over', onClick: start });
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKey, true);
      status.remove();
      root.remove();
    };
  },
});
