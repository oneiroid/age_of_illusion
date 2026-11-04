'use strict';

ILLUSIONS.push({
  id: 'endless-staircase',
  section: 'ear',
  title: 'Endless Staircase',
  credit: 'Shepard, 1964 · Risset, 1969',
  howto: 'Click Listen. Speakers work, headphones are better. Listen for a minute and follow the tones: is each one higher than the one before?',
  expect: 'Every tone is a step above the last, and the climb does not end. The counter under the picture keeps growing, and every 12 steps the sound is exactly the one you started from. Continuous glide plays Risset’s version: one slide that never arrives. Widen the bell and the trick shows: tones drop out at the top and come in at the bottom.',
  why: [
    'Each tone is a chord of nine sine waves spaced exactly an octave apart, from 27.5 Hz to about 14 kHz. Their loudness follows a fixed bell over frequency, the curve in the picture: loud in the middle, silent at both edges.',
    'At every step all nine rise by a semitone. The top one sinks into the silent edge of the bell, and a new one rises out of silence at the bottom. After 12 steps the spectrum is the same as at the start. Nothing jumps while you can hear it.',
    'Pitch has two parts: height, from low to high, and chroma, the note name, which repeats every octave. A chord of octaves has a clear chroma and no definite height. Each step moves the chroma one note up, nothing marks where the height is, and the brain reads every step as a step up (Shepard, 1964). Jean-Claude Risset made the same chord slide continuously (1969).',
    'A wide bell lets you hear the components at the edges. Now there is something to follow, and the climb breaks each time one leaves at the top.',
    'Christopher Nolan built the score of Dunkirk (2017) around this effect: tension that keeps rising and never resolves.',
  ],
  ru: {
    title: 'Бесконечная лестница',
    credit: 'Shepard, 1964 · Risset, 1969',
    howto: 'Нажмите «Слушать». Подойдут динамики, в наушниках лучше. Послушайте минуту и следите за тонами: каждый выше предыдущего?',
    expect: 'Каждый тон на ступень выше предыдущего, и подъём не кончается. Счётчик под картинкой растёт, а каждые 12 ступеней звук ровно тот же, с которого всё началось. «Плавное скольжение» включает вариант Риссе: один подъём, который никуда не приходит. Расширьте колокол, и фокус виден: тоны уходят сверху и появляются снизу.',
    why: [
      'Каждый тон — аккорд из девяти синусоид, разнесённых ровно на октаву, от 27,5 Гц до примерно 14 кГц. Их громкость задаёт неподвижный колокол по частоте, кривая на картинке: громко в середине, тишина по краям.',
      'На каждой ступени все девять поднимаются на полутон. Верхняя уходит в тихий край колокола, а снизу из тишины поднимается новая. Через 12 ступеней спектр тот же, что в начале. Ничто не прыгает, пока его слышно.',
      'У высоты звука две составляющие: высота от низкого к высокому и хрома, название ноты, которая повторяется каждую октаву. У аккорда из октав хрома ясная, а высота неопределённая. Каждая ступень сдвигает хрому на ноту вверх, высоту ничто не отмечает, и мозг читает каждую ступень как шаг вверх (Shepard, 1964). Жан-Клод Риссе заставил тот же аккорд скользить непрерывно (1969).',
      'Широкий колокол делает слышными составляющие на краях. Теперь есть за чем следить, и подъём ломается каждый раз, когда одна из них уходит сверху.',
      'Кристофер Нолан построил на этом эффекте музыку к «Дюнкерку» (2017): напряжение растёт и не разрешается.',
    ],
  },

  mount(stage, controls) {
    const FMIN = 27.5;        // A0; partial k sits k octaves above, shifted by the current step
    const N = 9;              // octaves covered, one sine per octave
    const CENTRE = N / 2;     // bell centre, in octaves above FMIN (~620 Hz)

    let glide = false;
    let down = false;
    let rate = 2;             // semitones per second
    let sigma = 1.2;          // bell width (standard deviation), octaves
    let pos = 0;              // semitones moved so far, signed; drives the picture
    let sched = null;         // audio state, set on start

    const view = createCanvas(stage);
    const status = addStatus(stage);
    status.set('');

    addToggle(controls, {
      label: tr('Continuous glide (Risset)', 'Плавное скольжение (Риссе)'), value: false,
      onChange: v => { glide = v; if (sched) sched.restart(); },
    });
    addToggle(controls, {
      label: tr('Downward', 'Вниз'), value: false,
      onChange: v => { down = v; },
    });
    addSlider(controls, {
      label: tr('Speed', 'Скорость'), min: 0.5, max: 10, step: 0.5, value: rate,
      format: v => decimal(v, 1) + tr(' semitones/s', ' полутона/с'),
      onInput: v => { rate = v; },
    });
    addSlider(controls, {
      label: tr('Bell width', 'Ширина колокола'), min: 0.6, max: 4, step: 0.1, value: sigma,
      format: v => decimal(v, 1) + tr(' oct', ' окт'),
      onInput: v => { sigma = v; },
    });

    const sound = createSound(stage, controls, { onStart: (ctx, out) => { sched = build(ctx, out); } });

    // Octave of partial k for a given step position, in [0, N).
    const octave = (k, p) => (((k + p / 12) % N) + N) % N;
    const bell = o => Math.exp(-0.5 * ((o - CENTRE) / sigma) ** 2);
    function amps(p) {
      const g = [];
      let e = 0;
      for (let k = 0; k < N; k++) { g[k] = bell(octave(k, p)); e += g[k] * g[k]; }
      const norm = 0.35 / Math.sqrt(e);    // constant power whatever the bell width
      return g.map(x => x * norm);
    }

    function build(ctx, out) {
      const env = ctx.createGain();
      env.connect(out);
      const osc = [], amp = [];
      for (let k = 0; k < N; k++) {
        const o = ctx.createOscillator();
        const a = ctx.createGain();
        o.frequency.value = FMIN * 2 ** octave(k, pos);
        a.gain.value = 0;
        o.connect(a).connect(env);
        o.start();
        osc.push(o); amp.push(a);
      }

      let last = ctx.currentTime;       // glide: audio time of the previous update
      let next = 0;                     // steps: audio time of the next tone
      let ahead = pos;                  // steps: position of the last scheduled tone
      let queue = [];                   // steps: [{ t, p }] scheduled but not yet sounding

      // Move partial k to position p at time t: glide there, or jump when it wraps or a tone starts.
      function move(k, t, p, g, jump) {
        const f = FMIN * 2 ** octave(k, p);
        const fp = osc[k].frequency, gp = amp[k].gain;
        if (jump) {
          fp.cancelScheduledValues(t); fp.setValueAtTime(f, t);
          gp.cancelScheduledValues(t); gp.setValueAtTime(g, t);
        } else {
          fp.setTargetAtTime(f, t, 0.012);
          gp.setTargetAtTime(g, t, 0.012);
        }
      }

      function set(t, p, jump) {
        const g = amps(p);
        for (let k = 0; k < N; k++) move(k, t, p, g[k], jump);
      }

      function restart() {
        const t = ctx.currentTime;
        env.gain.cancelScheduledValues(t);
        queue = [];
        pos = Math.round(pos);
        ahead = pos;
        last = t;
        if (glide) {
          env.gain.setTargetAtTime(1, t, 0.02);
          set(t, pos, true);
        } else {
          env.gain.setTargetAtTime(0, t, 0.01);
          next = t + 0.08;
        }
      }

      // Called every frame. Glide follows the audio clock, so Pause stops it.
      function tick() {
        const t = ctx.currentTime;
        const dir = down ? -1 : 1;
        if (glide) {
          const before = pos;
          pos += dir * rate * (t - last);
          last = t;
          const g = amps(pos);
          // A partial that crosses an edge reappears at the other one: jump it there while it is silent.
          for (let k = 0; k < N; k++) {
            move(k, t, pos, g[k], Math.abs(octave(k, pos) - octave(k, before)) > N / 2);
          }
          return;
        }
        // Steps: schedule tones a little ahead on the audio clock.
        while (next < t + 0.12) {
          const ts = Math.max(next, t);
          const dur = 1 / rate;
          const on = Math.min(0.8 * dur, dur - 0.05);
          ahead += dir;
          set(ts, ahead, true);
          const e = env.gain;
          e.setValueAtTime(0, ts);
          e.linearRampToValueAtTime(1, ts + 0.012);
          e.setValueAtTime(1, ts + on - 0.03);
          e.linearRampToValueAtTime(0, ts + on);
          queue.push({ t: ts, p: ahead });
          next = ts + dur;
        }
        while (queue.length && queue[0].t <= t) pos = queue.shift().p;
      }

      restart();
      return { tick, restart, stop: () => osc.forEach(o => o.stop()) };
    }

    const fg = cssVar('--text'), muted = cssVar('--text-muted'), line = cssVar('--border'),
      bg = cssVar('--background'), lamp = cssVar('--lamp'), mono = cssVar('--font-mono');

    const stopLoop = animate(() => {
      if (sched && !sound.paused) sched.tick();
      draw();
      if (sched) status.set(counter());
    });

    return () => {
      stopLoop();
      if (sched) sched.stop();
      sound.destroy();
      status.remove();
      view.destroy();
    };

    function counter() {
      const n = Math.round(pos);
      const steps = Math.abs(n);
      const r = ((n % 12) + 12) % 12;
      const off = n >= 0 ? r : (12 - r) % 12;
      const en = (n >= 0 ? 'Up ' : 'Down ') + steps + (steps === 1 ? ' semitone. ' : ' semitones. ') +
        (steps < 12 ? '' : off === 0 ? 'It sounds exactly as it did at the start.'
          : `It sounds exactly as it did ${off} ${off === 1 ? 'semitone' : 'semitones'} ${n >= 0 ? 'up' : 'down'}.`);
      const ru = (n >= 0 ? 'Вверх на ' : 'Вниз на ') + steps + ' ' + semitonesRu(steps) + '. ' +
        (steps < 12 ? '' : off === 0 ? 'Звучит ровно так же, как в начале.'
          : `Звучит ровно так же, как на ${off} ${semitonesRu(off)} ${n >= 0 ? 'выше' : 'ниже'} начала.`);
      return tr(en, ru).trim();
    }

    function semitonesRu(n) {
      const a = n % 10, b = n % 100;
      if (a === 1 && b !== 11) return 'полутон';
      if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'полутона';
      return 'полутонов';
    }

    // Spectrum view: log-frequency axis, the bell, and one bar per partial.
    function draw() {
      const { ctx, w, h } = view;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const padX = Math.max(24, w * 0.06);
      const base = h * 0.72, top = h * 0.16;
      const x = o => padX + (o / N) * (w - 2 * padX);
      const y = v => base - v * (base - top);

      // Frequency ticks.
      ctx.font = `400 13px ${mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const [f, en, ru] of [[100, '100 Hz', '100 Гц'], [1000, '1 kHz', '1 кГц'], [10000, '10 kHz', '10 кГц']]) {
        const xo = x(Math.log2(f / FMIN));
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xo, top); ctx.lineTo(xo, base + 8); ctx.stroke();
        ctx.fillStyle = muted;
        ctx.fillText(tr(en, ru), xo, base + 12);
      }
      ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.moveTo(x(0), base); ctx.lineTo(x(N), base); ctx.stroke();

      // The bell: loudness over frequency. It never moves.
      ctx.strokeStyle = lamp;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const o = (i / 200) * N;
        const px = x(o), py = y(bell(o));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();

      // Partials: they move under the bell.
      ctx.strokeStyle = fg;
      ctx.lineWidth = 3;
      for (let k = 0; k < N; k++) {
        const o = octave(k, pos);
        const px = x(o);
        ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px, y(bell(o))); ctx.stroke();
      }
    }
  },
});
