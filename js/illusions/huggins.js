'use strict';

ILLUSIONS.push({
  id: 'melody-in-noise',
  section: 'ear',
  title: 'Melody in the Noise',
  credit: 'Cramer & Huggins, 1958',
  howto: 'Headphones only. Through speakers there is nothing to hear. Click Listen, then play a tune or press the keys under the picture.',
  expect: 'At first there is only hiss. When a tune plays, faint notes float out of the noise, somewhere inside your head. Each ear gets plain white noise the whole time: lift one earcup and the tune is gone. Turn on Same noise in both ears and it is gone from both.',
  why: [
    'Both ears get the same white noise, except in a narrow band of frequencies around the note. There the right ear’s copy is shifted in phase, by half a cycle at the note itself. Each ear alone gets nothing but noise: its spectrum stays flat, and the two spectra in the picture look the same.',
    'To locate sounds, the brain lines up the two ears’ signals frequency by frequency and compares them. What both ears share it groups into one centred hiss and sets aside. The band where they disagree does not fit and is heard on its own, as a faint tone at the band’s centre (Cramer & Huggins, 1958; the cancellation account is Durlach’s, 1963).',
    'The tune is in neither sound wave. It exists only in the difference between the ears, the bottom row of the picture. Through speakers each ear hears both channels mixed together, the difference is lost, and the tune with it.',
    'Because it needs headphones, this pitch is used to check that people in online listening experiments are wearing them (Milne et al., 2021).',
  ],
  ru: {
    title: 'Мелодия в шуме',
    credit: 'Cramer & Huggins, 1958',
    howto: 'Только в наушниках. Через динамики слышать нечего. Нажмите «Слушать», затем включите мелодию или нажимайте клавиши под картинкой.',
    expect: 'Сначала только шипение. Когда играет мелодия, из шума выплывают тихие ноты, где-то внутри головы. Каждое ухо всё время получает обычный белый шум: снимите один наушник, и мелодии нет. Включите «Одинаковый шум в оба уха», и её нет в обоих.',
    why: [
      'Оба уха получают один и тот же белый шум, кроме узкой полосы частот вокруг ноты. Там копия для правого уха сдвинута по фазе, на ноте ровно на полпериода. Каждое ухо по отдельности получает только шум: его спектр ровный, и два спектра на картинке выглядят одинаково.',
      'Чтобы определить, откуда звук, мозг сопоставляет сигналы двух ушей частота за частотой. То, что у ушей общее, он собирает в одно шипение посередине и откладывает в сторону. Полоса, где уши расходятся, в это шипение не укладывается и слышна отдельно, как тихий тон на её середине (Cramer & Huggins, 1958; объяснение через вычитание общего — Durlach, 1963).',
      'Мелодии нет ни в одной звуковой волне. Она есть только в разнице между ушами, нижний ряд картинки. Через динамики каждое ухо слышит оба канала вместе, разница теряется, а с ней и мелодия.',
      'Раз эта высота слышна только в наушниках, по ней проверяют, надеты ли наушники у участников онлайн-экспериментов со звуком (Milne et al., 2021).',
    ],
  },

  mount(stage, controls) {
    // G4..C6, white keys. Huggins pitch is clearest from a few hundred Hz to about 1 kHz.
    const KEYS = [
      ['G', 'Соль', 392.00], ['A', 'Ля', 440.00], ['B', 'Си', 493.88], ['C', 'До', 523.25],
      ['D', 'Ре', 587.33], ['E', 'Ми', 659.26], ['F', 'Фа', 698.46], ['G', 'Соль', 783.99],
      ['A', 'Ля', 880.00], ['B', 'Си', 987.77], ['C', 'До', 1046.50],
    ];
    const Q = 8;              // all-pass sharpness: the phase turns through 180° over about f/Q
    const BEAT = 0.42;        // seconds per quarter note
    // [key index, beats]. Both tunes are public domain.
    const TUNES = [
      [tr('Ode to Joy', 'Ода к радости'), [
        [5, 1], [5, 1], [6, 1], [7, 1], [7, 1], [6, 1], [5, 1], [4, 1], [3, 1], [3, 1], [4, 1], [5, 1], [5, 1.5], [4, 0.5], [4, 2],
        [5, 1], [5, 1], [6, 1], [7, 1], [7, 1], [6, 1], [5, 1], [4, 1], [3, 1], [3, 1], [4, 1], [5, 1], [4, 1.5], [3, 0.5], [3, 2],
      ]],
      [tr('Frère Jacques', 'Братец Яков'), [
        [3, 1], [4, 1], [5, 1], [3, 1], [3, 1], [4, 1], [5, 1], [3, 1],
        [5, 1], [6, 1], [7, 2], [5, 1], [6, 1], [7, 2],
        [7, 0.5], [8, 0.5], [7, 0.5], [6, 0.5], [5, 1], [3, 1], [7, 0.5], [8, 0.5], [7, 0.5], [6, 0.5], [5, 1], [3, 1],
        [3, 1], [0, 1], [3, 2], [3, 1], [0, 1], [3, 2],
      ]],
    ];

    let mono = false;
    let audio = null;         // graph, set on start
    let notes = [];           // [{ t0, t1, key }] on the audio clock
    let held = null;          // note held down with the pointer

    const root = h('div', { className: 'ear' });
    const plot = h('div', { className: 'ear-plot' });
    const keyEls = KEYS.map(([en, ru], i) => h('button', {
      type: 'button', className: 'ear-key', 'aria-label': tr(en, ru),
      onpointerdown: e => { e.preventDefault(); press(i); },
      onpointerup: release, onpointerleave: release, onpointercancel: release,
      onkeydown: e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(i); } },
      onkeyup: e => { if (e.key === ' ' || e.key === 'Enter') release(); },
    }, tr(en, ru)));
    const tunes = h('div', { className: 'ear-tunes' },
      TUNES.map(([name, seq]) => h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', onclick: () => playTune(seq) }, name)),
      h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', onclick: stopAll }, tr('Stop', 'Стоп')));
    root.append(plot, h('div', { className: 'ear-bar' }, h('div', { className: 'ear-keys' }, keyEls), tunes));
    stage.appendChild(root);
    const view = createCanvas(plot);

    addToggle(controls, {
      label: tr('Same noise in both ears', 'Одинаковый шум в оба уха'), value: false,
      onChange: v => {
        mono = v;
        if (!audio) return;
        const t = audio.ctx.currentTime;
        audio.leftOwn.gain.setTargetAtTime(v ? 0 : 1, t, 0.01);
        audio.leftCopy.gain.setTargetAtTime(v ? 1 : 0, t, 0.01);
      },
    });

    const sound = createSound(stage, controls, {
      note: tr('Headphones on. Through speakers this is only noise.', 'Наденьте наушники. Через динамики это просто шум.'),
      onStart: (ctx, out) => { audio = build(ctx, out); },
    });

    function build(ctx, out) {
      // Eight seconds of white noise, looped, sent to both ears.
      const len = ctx.sampleRate * 8;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() - 0.5;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      // Right ear: the noise either as is, or through an all-pass filter that turns the
      // phase around the note and leaves every amplitude alone.
      const allpass = ctx.createBiquadFilter();
      allpass.type = 'allpass';
      allpass.Q.value = Q;
      allpass.frequency.value = KEYS[3][2];
      const shifted = ctx.createGain(), plain = ctx.createGain();
      shifted.gain.value = 0;
      plain.gain.value = 1;
      const right = ctx.createGain();
      src.connect(allpass).connect(shifted).connect(right);
      src.connect(plain).connect(right);

      // Left ear: its own unshifted noise, or a copy of the right ear.
      const leftOwn = ctx.createGain(), leftCopy = ctx.createGain();
      leftOwn.gain.value = mono ? 0 : 1;
      leftCopy.gain.value = mono ? 1 : 0;
      const left = ctx.createGain();
      src.connect(leftOwn).connect(left);
      right.connect(leftCopy).connect(left);

      const merge = ctx.createChannelMerger(2);
      left.connect(merge, 0, 0);
      right.connect(merge, 0, 1);
      merge.connect(out);

      const analyser = node => {
        const a = ctx.createAnalyser();
        a.fftSize = 4096;
        a.smoothingTimeConstant = 0.85;
        node.connect(a);
        return a;
      };
      const aL = analyser(left), aR = analyser(right);
      src.start();
      return { ctx, src, allpass, shifted, plain, leftOwn, leftCopy, aL, aR, spec: new Float32Array(aL.frequencyBinCount) };
    }

    // Switch the phase shift on at t0 and off at t1 for one note.
    function schedule(key, t0, t1) {
      const { allpass, shifted, plain } = audio;
      allpass.frequency.setValueAtTime(KEYS[key][2], t0);
      shifted.gain.setTargetAtTime(1, t0, 0.004);
      plain.gain.setTargetAtTime(0, t0, 0.004);
      if (t1 < Infinity) {
        shifted.gain.setTargetAtTime(0, t1, 0.004);
        plain.gain.setTargetAtTime(1, t1, 0.004);
      }
    }

    function stopAll() {
      held = null;
      notes = [];
      if (!audio) return;
      const t = audio.ctx.currentTime;
      for (const p of [audio.allpass.frequency, audio.shifted.gain, audio.plain.gain]) p.cancelScheduledValues(t);
      audio.shifted.gain.setTargetAtTime(0, t, 0.004);
      audio.plain.gain.setTargetAtTime(1, t, 0.004);
    }

    function playTune(seq) {
      if (!audio) return;
      stopAll();
      let t = audio.ctx.currentTime + 0.1;
      for (const [key, beats] of seq) {
        const dur = beats * BEAT;
        const n = { key, t0: t, t1: t + dur - Math.min(0.08, dur * 0.2) };
        schedule(n.key, n.t0, n.t1);
        notes.push(n);
        t += dur;
      }
    }

    function press(key) {
      if (!audio) return;
      stopAll();
      const t = audio.ctx.currentTime;
      held = { key, t0: t, t1: Infinity };
      notes.push(held);
      schedule(key, t, Infinity);
    }

    function release() {
      if (!held || !audio) return;
      held.t1 = audio.ctx.currentTime;
      schedule(held.key, held.t0, held.t1);
      held = null;
    }

    const fg = cssVar('--text'), muted = cssVar('--text-muted'), line = cssVar('--border'),
      bg = cssVar('--background'), lamp = cssVar('--lamp'), font = cssVar('--font-mono');
    const FLO = 100, FHI = 5000;
    const NF = 256;
    const freqs = new Float32Array(NF), mag = new Float32Array(NF), phase = new Float32Array(NF);
    for (let i = 0; i < NF; i++) freqs[i] = FLO * (FHI / FLO) ** (i / (NF - 1));

    const stopLoop = animate(draw);
    return () => {
      stopLoop();
      if (audio) audio.src.stop();
      sound.destroy();
      view.destroy();
      root.remove();
    };

    function sounding() {
      if (!audio) return null;
      const t = audio.ctx.currentTime;
      return notes.find(n => n.t0 <= t && t < n.t1) || null;
    }

    function draw() {
      const { ctx, w, h } = view;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const now = sounding();
      keyEls.forEach((el, i) => el.classList.toggle('on', !!now && now.key === i));

      const padX = Math.max(24, w * 0.05);
      const rows = [
        [tr('Left ear', 'Левое ухо'), 'L'],
        [tr('Right ear', 'Правое ухо'), 'R'],
        [tr('Difference between the ears', 'Разница между ушами'), 'D'],
      ];
      const rowH = (h - 24) / rows.length;
      const x = f => padX + (Math.log(f / FLO) / Math.log(FHI / FLO)) * (w - 2 * padX);

      ctx.font = `400 13px ${font}`;
      ctx.textBaseline = 'top';
      rows.forEach(([label, kind], r) => {
        const top = 12 + r * rowH + 24, base = 12 + (r + 1) * rowH - 12;
        ctx.fillStyle = muted;
        ctx.textAlign = 'left';
        ctx.fillText(label, padX, 12 + r * rowH);
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padX, base); ctx.lineTo(w - padX, base); ctx.stroke();

        ctx.beginPath();
        if (kind === 'D') {
          // Interaural phase difference, 0 to half a cycle.
          const shift = mono || !now ? 0 : 1;
          if (shift) audio.allpass.getFrequencyResponse(freqs, mag, phase);
          for (let i = 0; i < NF; i++) {
            const v = shift ? Math.abs(phase[i]) / Math.PI : 0;
            const px = x(freqs[i]), py = base - v * (base - top);
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.strokeStyle = lamp;
          ctx.lineWidth = 2;
        } else {
          // Level spectrum of what reaches this ear: flat noise either way.
          const a = audio && (kind === 'L' ? audio.aL : audio.aR);
          let first = true;
          if (a) {
            a.getFloatFrequencyData(audio.spec);
            const binHz = audio.ctx.sampleRate / a.fftSize;
            for (let b = Math.ceil(FLO / binHz); b * binHz <= FHI; b++) {
              const v = Math.min(1, Math.max(0, (audio.spec[b] + 110) / 60));
              const px = x(b * binHz), py = base - v * (base - top);
              first ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
              first = false;
            }
          } else {
            ctx.moveTo(padX, base); ctx.lineTo(w - padX, base);
          }
          ctx.strokeStyle = fg;
          ctx.lineWidth = 1.5;
        }
        ctx.stroke();
      });

      // Frequency ticks under the last row.
      ctx.textAlign = 'center';
      ctx.fillStyle = muted;
      for (const [f, en, ru] of [[200, '200 Hz', '200 Гц'], [500, '500 Hz', '500 Гц'], [1000, '1 kHz', '1 кГц'], [2000, '2 kHz', '2 кГц']]) {
        ctx.fillText(tr(en, ru), x(f), h - 20);
      }
    }
  },
});
