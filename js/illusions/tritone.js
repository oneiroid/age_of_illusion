'use strict';

ILLUSIONS.push({
  id: 'tritone-paradox',
  section: 'ear',
  gated: true,
  title: 'Tritone Paradox',
  credit: 'Deutsch, 1986, 1991; Deutsch, Henthorn & Dolson, 2004',
  howto: 'Speakers or headphones. You hear 24 pairs of tones. After each pair, answer whether it went up or down: the buttons, or the ↑ and ↓ keys. Answer by first impression.',
  expect: 'Every pair was two tones exactly half an octave apart. In these tones, half an octave up and half an octave down lead to the same note, so the sound itself has no direction. Most people still hear each pair clearly going one way, and the same way each time. Which way depends on the notes: the circle shows which notes you heard as higher. Another person can hear the same pairs the other way round.',
  why: [
    'Each tone is a Shepard tone, as in Endless Staircase: octaves under a fixed bell, a clear note name and no definite height. Between two such tones the brain takes the shorter way round the circle of notes. Half an octave, a tritone, is exactly halfway: both ways are equally short, and the sound gives no hint.',
    'Listeners are consistent anyway. Each person hears the notes in one half of the circle as higher and the other half as lower, and where the line falls differs from person to person (Deutsch, 1986).',
    'Where it falls goes with the language heard in childhood. Listeners who grew up in California and in the south of England tend to resolve the pairs in opposite ways (Deutsch, 1991). Listeners whose first language was Vietnamese differ from Californian English speakers, even when they no longer speak it (Deutsch, Henthorn & Dolson, 2004). The orientation also matches the pitch range of the listener’s own speaking voice (Deutsch, North & Ray, 1990), and children tend to share it with their mothers.',
    'One account: we carry a template of where pitch sits, learned from the voices around us early in life, and place notes without a height on it.',
  ],
  ru: {
    title: 'Парадокс тритона',
    credit: 'Deutsch, 1986, 1991; Deutsch, Henthorn & Dolson, 2004',
    howto: 'Динамики или наушники. Вы услышите 24 пары тонов. После каждой пары ответьте, вверх она шла или вниз: кнопками или клавишами ↑ и ↓. Отвечайте по первому впечатлению.',
    expect: 'Каждая пара — два тона ровно в полоктаве друг от друга. У этих тонов полоктавы вверх и полоктавы вниз приводят к одной и той же ноте, так что в самом звуке направления нет. Большинство всё равно слышит каждую пару ясно идущей в одну сторону, и каждый раз в ту же. В какую — зависит от нот: круг показывает, какие ноты вы слышали более высокими. Другой человек может слышать те же пары наоборот.',
    why: [
      'Каждый тон — тон Шепарда, как в «Бесконечной лестнице»: октавы под неподвижным колоколом, ясное название ноты и никакой определённой высоты. Между двумя такими тонами мозг выбирает более короткий путь по кругу нот. Полоктавы, тритон, — ровно половина круга: оба пути одинаково коротки, и звук не подсказывает.',
      'И всё же слушатели последовательны. Каждый слышит ноты одной половины круга более высокими, другой — более низкими, а где проходит граница, у разных людей по-разному (Deutsch, 1986).',
      'Где она проходит, связано с языком, который человек слышал в детстве. Те, кто вырос в Калифорнии и на юге Англии, обычно слышат пары противоположно (Deutsch, 1991). Те, чей первый язык — вьетнамский, слышат иначе, чем калифорнийцы-англоговорящие, даже если вьетнамским уже не владеют (Deutsch, Henthorn & Dolson, 2004). Ориентация совпадает и с диапазоном высоты собственного голоса слушателя (Deutsch, North & Ray, 1990), а у детей она обычно та же, что у матерей.',
      'Одно из объяснений: у нас есть шаблон того, где находится высота, усвоенный в детстве по голосам вокруг, и ноты без высоты мы раскладываем по нему.',
    ],
  },

  mount(stage, controls, { reveal }) {
    const NAMES = tr(
      ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
      ['До', 'До♯', 'Ре', 'Ре♯', 'Ми', 'Фа', 'Фа♯', 'Соль', 'Соль♯', 'Ля', 'Ля♯', 'Си']);
    const C0 = 16.3516;                // Hz, lowest C
    const CENTRES = [261.63, 369.99];  // bell centres, C4 and F♯4: each pair is heard under both
    const SIGMA = 1;                   // bell width, octaves
    const TONE = 0.5;                  // seconds per tone, no gap
    const LOG_KEY = 'tritone-log';

    const root = h('div', { className: 'mind' });
    stage.appendChild(root);
    const sound = createSound(stage, controls, { gate: false, pause: false });

    let tones = null;         // AudioBuffers [centre][pitch class]
    let trials, at, answers, playing, canAnswer, nextTimer = 0, view = null;

    intro();

    function onKey(e) {
      if (!trials || at >= trials.length || !canAnswer) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); answer('up'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); answer('down'); }
    }
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(nextTimer);
      if (view) view.destroy();
      sound.destroy();
      root.remove();
    };

    function screen(...children) {
      if (view) { view.destroy(); view = null; }
      root.replaceChildren(h('div', { className: 'mind-col' }, ...children));
    }

    function intro() {
      screen(
        h('p', { className: 'mind-big' }, tr('Up or down', 'Вверх или вниз')),
        h('p', { className: 'mind-sub' }, tr(
          '24 pairs of tones. After each pair, answer whether the second tone was higher or lower than the first.',
          '24 пары тонов. После каждой пары ответьте, был второй тон выше первого или ниже.')),
        h('button', { type: 'button', className: 'wr-btn wr-btn-curtain', onclick: start }, tr('Start', 'Начать')),
        h('p', { className: 'mind-note' }, tr('Speakers or headphones. About two minutes.', 'Динамики или наушники. Около двух минут.')));
    }

    function start() {
      const ctx = sound.ensure();
      if (!ctx) {
        screen(h('p', { className: 'mind-sub' }, tr('Error. This browser has no Web Audio.', 'Ошибка. В этом браузере нет Web Audio.')));
        return;
      }
      if (!tones) tones = CENTRES.map(c => NAMES.map((_, pc) => shepardTone(ctx, pc, c)));
      trials = [];
      for (let c = 0; c < CENTRES.length; c++) {
        for (let p = 0; p < 12; p++) trials.push({ p1: p, p2: (p + 6) % 12, c });
      }
      for (let i = trials.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trials[i], trials[j]] = [trials[j], trials[i]];
      }
      at = 0;
      answers = [];
      trial();
    }

    function trial() {
      canAnswer = false;
      const up = h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', disabled: true, onclick: () => answer('up') },
        tr('Up', 'Вверх'), ' ', h('kbd', null, '↑'));
      const down = h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', disabled: true, onclick: () => answer('down') },
        tr('Down', 'Вниз'), ' ', h('kbd', null, '↓'));
      screen(
        h('p', { className: 'mind-step stamp' }, tr(`Pair ${at + 1} of ${trials.length}`, `Пара ${at + 1} из ${trials.length}`)),
        h('p', { className: 'mind-big' }, tr('Up or down?', 'Вверх или вниз?')),
        h('div', { className: 'ear-updown' }, up, down),
        h('button', { type: 'button', className: 'wr-btn wr-btn-lamp mind-go', onclick: play }, tr('Play again', 'Повторить')));
      playing = [up, down];
      play();
    }

    function play() {
      const ctx = sound.ctx, t = ctx.currentTime + 0.15, cur = trials[at];
      for (const [pc, dt] of [[cur.p1, 0], [cur.p2, TONE]]) {
        const src = ctx.createBufferSource();
        src.buffer = tones[cur.c][pc];
        src.connect(sound.out);
        src.start(t + dt);
      }
      // Answers open once the second tone has begun.
      clearTimeout(nextTimer);
      nextTimer = setTimeout(() => { canAnswer = true; playing.forEach(b => { b.disabled = false; }); }, (0.15 + TONE) * 1000);
    }

    function answer(dir) {
      if (!canAnswer) return;
      canAnswer = false;
      playing.forEach(b => { b.disabled = true; });
      answers.push({ ...trials[at], dir });
      at++;
      if (at < trials.length) nextTimer = setTimeout(trial, 500);
      else result();
    }

    // How often each note was heard as the higher one, the peak direction, and consistency.
    function analyse() {
      const higher = Array(12).fill(0), seen = Array(12).fill(0);
      for (const a of answers) {
        seen[a.p1]++; seen[a.p2]++;
        higher[a.dir === 'down' ? a.p1 : a.p2]++;
      }
      const frac = higher.map((n, pc) => n / seen[pc]);
      let x = 0, y = 0, max = 0;
      frac.forEach((f, pc) => {
        const a = pc * Math.PI / 6;
        x += (f - 0.5) * Math.sin(a); y += (f - 0.5) * Math.cos(a);
        max += 0.5 * Math.abs(Math.cos(a));
      });
      const peak = ((Math.round(Math.atan2(x, y) / (Math.PI / 6)) % 12) + 12) % 12;
      const strength = Math.hypot(x, y) / max;
      // Each tritone pair is heard four times (two orders, two bells): count agreement with its majority.
      let same = 0;
      for (let p = 0; p < 6; p++) {
        const q = p + 6;
        const pairs = answers.filter(a => a.p1 === p || a.p1 === q);
        const pHigh = pairs.filter(a => (a.dir === 'down' ? a.p1 : a.p2) === p).length;
        same += Math.max(pHigh, pairs.length - pHigh);
      }
      return { frac, peak, strength, same };
    }

    function result() {
      const r = analyse();
      let log = [];
      try { log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { /* storage unavailable */ }
      const earlier = log.slice(-5).reverse();
      try {
        log.push({ at: new Date().toISOString(), peak: r.peak, same: r.same, n: answers.length });
        localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-20)));
      } catch (e) { /* storage unavailable */ }

      const clear = r.same >= 18 && r.strength >= 0.25;
      const higherNotes = r.frac.map((f, pc) => [f, pc]).filter(([f]) => f > 0.5).map(([, pc]) => NAMES[pc]);
      const plot = h('div', { className: 'ear-canvas' });
      screen(
        h('p', { className: 'mind-step stamp' }, tr('Result', 'Результат')),
        h('p', { className: 'mind-big' }, clear
          ? tr(`Your peak: ${NAMES[r.peak]}`, `Ваш пик: ${NAMES[r.peak]}`)
          : tr('No clear peak', 'Ясного пика нет')),
        h('p', { className: 'mind-sub' }, clear
          ? tr(`You heard the same pair go the same way in ${r.same} of ${answers.length} cases. The sound never showed a direction.`,
            `Одна и та же пара шла у вас в ту же сторону в ${r.same} случаях из ${answers.length}. Направления в звуке не было ни разу.`)
          : tr(`The same pair went the same way in ${r.same} of ${answers.length} cases. For you the pairs stay close to ambiguous. This happens.`,
            `Одна и та же пара шла в ту же сторону в ${r.same} случаях из ${answers.length}. Для вас пары остаются почти неоднозначными. Так бывает.`)),
        plot,
        higherNotes.length > 0 && h('p', { className: 'mind-note' },
          tr('Heard as higher more often than not: ', 'Чаще слышались более высокими: ') + higherNotes.join(', ') + '.'),
        earlier.length > 0 && h('h4', null, tr('Earlier on this device', 'Раньше на этом устройстве')),
        earlier.length > 0 && h('table', { className: 'mind-table' }, earlier.map(e => h('tr', null,
          h('td', null, new Date(e.at).toLocaleString(window.LANG, { dateStyle: 'short', timeStyle: 'short' })),
          h('td', null, NAMES[e.peak]),
          h('td', null, `${e.same} / ${e.n}`)))),
        h('p', { className: 'mind-note' }, tr('Ask someone else to try. Compare the circles.', 'Предложите попробовать кому-нибудь ещё. Сравните круги.')),
        h('button', { type: 'button', className: 'wr-btn wr-btn-quiet mind-go', onclick: start }, tr('Again', 'Ещё раз')));
      view = createCanvas(plot, v => drawCircle(v, r, clear));
      reveal();
    }

    // Circle of notes; each bar is how often that note was heard as the higher one.
    function drawCircle(v, r, clear) {
      const { ctx, w, h: hh } = v;
      const fg = cssVar('--text'), muted = cssVar('--text-muted'), line = cssVar('--border'),
        lamp = cssVar('--lamp'), font = cssVar('--font-mono');
      ctx.clearRect(0, 0, w, hh);
      const cx = w / 2, cy = hh / 2, R = Math.min(w, hh) / 2 - 28, r0 = R * 0.25;
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, r0 + 0.5 * (R - r0), 0, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, r0, 0, 2 * Math.PI); ctx.stroke();
      ctx.font = `400 13px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      r.frac.forEach((f, pc) => {
        const a = pc * Math.PI / 6, sx = Math.sin(a), sy = -Math.cos(a);
        ctx.strokeStyle = clear && pc === r.peak ? lamp : fg;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx + sx * r0, cy + sy * r0);
        ctx.lineTo(cx + sx * (r0 + f * (R - r0) + 0.5), cy + sy * (r0 + f * (R - r0) + 0.5));
        ctx.stroke();
        ctx.fillStyle = clear && pc === r.peak ? lamp : muted;
        ctx.fillText(NAMES[pc], cx + sx * (R + 16), cy + sy * (R + 16));
      });
    }

    // One Shepard tone: octaves of pitch class `pc` under a bell centred at `centre` Hz.
    function shepardTone(ctx, pc, centre) {
      const sr = ctx.sampleRate, n = Math.round(TONE * sr), ramp = Math.round(0.015 * sr);
      const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
      const parts = [];
      for (let f = C0 * 2 ** (pc / 12); f < Math.min(16000, sr / 2); f *= 2) {
        parts.push([f, Math.exp(-0.5 * (Math.log2(f / centre) / SIGMA) ** 2)]);
      }
      const norm = 0.35 / Math.sqrt(parts.reduce((s, [, a]) => s + a * a, 0));
      for (let i = 0; i < n; i++) {
        let v = 0;
        for (const [f, a] of parts) v += a * Math.sin(2 * Math.PI * f * i / sr);
        const env = i < ramp ? 0.5 - 0.5 * Math.cos(Math.PI * i / ramp)
          : i > n - ramp ? 0.5 - 0.5 * Math.cos(Math.PI * (n - i) / ramp) : 1;
        d[i] = v * norm * env;
      }
      return buf;
    }
  },
});
