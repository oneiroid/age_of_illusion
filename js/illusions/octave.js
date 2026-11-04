'use strict';

ILLUSIONS.push({
  id: 'octave-illusion',
  section: 'ear',
  gated: true,
  title: 'Octave Illusion',
  credit: 'Deutsch, 1974; Deutsch & Roll, 1976',
  howto: 'Headphones only. Listen and say what you hear. Then the left and right channels are swapped, and you answer again.',
  expect: 'Each ear got the same two tones, 400 Hz and 800 Hz, in turn, and whenever the left ear had one the right ear had the other. Most people hear something else: one tone jumping between the ears, high on one side and low on the other. When the channels are swapped, many still hear the high tone on the same side. Most right-handers hear it on the right.',
  why: [
    'The sequence is 400 Hz and 800 Hz, 250 ms each, with no gaps, and the two ears always get different tones. Nothing in it moves from ear to ear.',
    'Deutsch proposed that two decisions are made separately. Which pitch you hear follows one ear, the dominant one: the right ear for most right-handers. Where you hear it follows the ear that gets the higher tone. When the right ear has 800 Hz, both rules say high and right. When it has 400 Hz, the pitch rule says low and the place rule says left: you hear a low tone on the left, though the left ear has 800 Hz at that moment (Deutsch & Roll, 1976).',
    'Swapping the channels gives the same sequence shifted by one tone. The dominant ear is still the same ear, so the high tone stays on the same side.',
    'Right-handers mostly hear the high tone on the right. Left-handers are split more evenly between the two sides (Deutsch, 1974, 1983).',
  ],
  ru: {
    title: 'Октавная иллюзия',
    credit: 'Deutsch, 1974; Deutsch & Roll, 1976',
    howto: 'Только в наушниках. Послушайте и ответьте, что слышите. Затем левый и правый каналы поменяются местами, и вы ответите ещё раз.',
    expect: 'Каждое ухо получало одни и те же два тона, 400 Гц и 800 Гц, по очереди, и когда в левом был один, в правом был другой. Большинство слышит другое: один тон, который прыгает из уха в ухо, высокий с одной стороны и низкий с другой. Когда каналы меняются местами, многие по-прежнему слышат высокий тон на той же стороне. Большинство правшей слышит его справа.',
    why: [
      'Последовательность — 400 Гц и 800 Гц по 250 мс, без пауз, и уши всегда получают разные тоны. Ничто в ней не перемещается из уха в ухо.',
      'Дойч предположила, что принимаются два отдельных решения. Какую высоту вы слышите, определяет одно ухо, ведущее: у большинства правшей правое. Где вы её слышите, определяет ухо, в которое приходит более высокий тон. Когда в правом ухе 800 Гц, оба правила говорят: высоко и справа. Когда в нём 400 Гц, правило высоты говорит «низко», а правило места — «слева»: вы слышите низкий тон слева, хотя в левом ухе в этот момент 800 Гц (Deutsch & Roll, 1976).',
      'Если поменять каналы, получится та же последовательность, сдвинутая на один тон. Ведущее ухо остаётся тем же, поэтому высокий тон остаётся на той же стороне.',
      'Правши в основном слышат высокий тон справа. Левши делятся между сторонами ровнее (Deutsch, 1974, 1983).',
    ],
  },

  mount(stage, controls, { reveal }) {
    const LOW = 400, HIGH = 800;
    const CHOICES = [
      ['right', tr('High on the right, low on the left', 'Высокий справа, низкий слева')],
      ['left', tr('High on the left, low on the right', 'Высокий слева, низкий справа')],
      ['both', tr('Both tones in both ears', 'Оба тона в обоих ушах')],
      ['other', tr('Something else', 'Что-то другое')],
    ];
    const label = id => CHOICES.find(c => c[0] === id)[1];

    let swap = false;
    let toneLen = 0.25;       // seconds per tone
    let audio = null;         // { oscL, oscR, next, k, events }
    let view = null, answers = [], timer = 0, extra = false;

    const root = h('div', { className: 'mind' });
    stage.appendChild(root);
    const sound = createSound(stage, controls, { gate: false, stereoCheck: true });

    const stopLoop = animate(() => {
      if (audio && !sound.paused) schedule();
      if (view) drawLanes(view);
    });

    intro();

    return () => {
      stopLoop();
      clearTimeout(timer);
      if (audio) { audio.oscL.stop(); audio.oscR.stop(); }
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
        h('p', { className: 'mind-big' }, tr('Where is the high tone?', 'Где высокий тон?')),
        h('p', { className: 'mind-sub' }, tr(
          'Put on headphones. Left, then right should beep in the left ear, then in the right.',
          'Наденьте наушники. «Слева, затем справа» должно пискнуть сначала в левом ухе, потом в правом.')),
        h('div', { className: 'ear-actions' },
          h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', onclick: () => sound.checkEars() }, tr('Left, then right', 'Слева, затем справа')),
          h('button', { type: 'button', className: 'wr-btn wr-btn-curtain', onclick: start }, tr('Start', 'Начать'))));
    }

    function start() {
      const ctx = sound.ensure();
      if (!ctx) {
        screen(h('p', { className: 'mind-sub' }, tr('Error. This browser has no Web Audio.', 'Ошибка. В этом браузере нет Web Audio.')));
        return;
      }
      if (!audio) audio = build(ctx);
      swap = false;
      answers = [];
      ask(0);
    }

    function build(ctx) {
      const merge = ctx.createChannelMerger(2);
      const voice = ch => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        g.gain.value = 0.25;
        o.connect(g).connect(merge, 0, ch);
        o.start();
        return o;
      };
      const a = { oscL: voice(0), oscR: voice(1), next: ctx.currentTime + 0.1, k: 0, events: [] };
      merge.connect(sound.out);
      return a;
    }

    // Tones are set a little ahead on the audio clock; events keep them for the picture.
    function schedule() {
      const t = sound.ctx.currentTime;
      if (audio.next < t) audio.next = t + 0.05;
      while (audio.next < t + 0.2) {
        const leftHigh = (audio.k % 2 === 0) !== swap;
        audio.oscL.frequency.setValueAtTime(leftHigh ? HIGH : LOW, audio.next);
        audio.oscR.frequency.setValueAtTime(leftHigh ? LOW : HIGH, audio.next);
        audio.events.push({ t: audio.next, d: toneLen, leftHigh });
        audio.k++;
        audio.next += toneLen;
      }
      while (audio.events.length && audio.events[0].t < t - 4) audio.events.shift();
    }

    function ask(round) {
      const buttons = CHOICES.map(([id, text]) => h('button', {
        type: 'button', className: 'wr-btn wr-btn-quiet', disabled: true,
        onclick: () => {
          answers[round] = id;
          if (round === 0) { swap = !swap; ask(1); } else result();
        },
      }, text));
      screen(
        h('p', { className: 'mind-step stamp' }, tr(`Listening ${round + 1} of 2`, `Прослушивание ${round + 1} из 2`)),
        h('p', { className: 'mind-big' }, tr('What do you hear?', 'Что вы слышите?')),
        h('p', { className: 'mind-sub' }, round === 0
          ? tr('Listen for a few seconds before you answer.', 'Послушайте несколько секунд, прежде чем ответить.')
          : tr('The left and right channels are now swapped. Listen again.', 'Левый и правый каналы теперь поменялись местами. Послушайте ещё раз.')),
        h('div', { className: 'ear-choice' }, buttons));
      clearTimeout(timer);
      timer = setTimeout(() => buttons.forEach(b => { b.disabled = false; }), 3000);
    }

    function result() {
      const [a1, a2] = answers;
      const sided = a => a === 'right' || a === 'left';
      const head = sided(a1) && a1 === a2 ? tr('The high tone stayed on the same side', 'Высокий тон остался на той же стороне')
        : sided(a1) && sided(a2) ? tr('The high tone changed sides', 'Высокий тон перешёл на другую сторону')
        : a1 === 'both' && a2 === 'both' ? tr('You heard what is played', 'Вы слышали то, что звучит')
        : tr('Here is what was played', 'Вот что звучало');
      const plot = h('div', { className: 'ear-canvas short' });
      screen(
        h('p', { className: 'mind-step stamp' }, tr('Result', 'Результат')),
        h('p', { className: 'mind-big' }, head),
        h('p', { className: 'mind-sub' },
          tr(`First: ${label(a1).toLowerCase()}. After the swap: ${label(a2).toLowerCase()}.`,
            `Сначала: ${label(a1).toLowerCase()}. После обмена: ${label(a2).toLowerCase()}.`)),
        h('h4', null, tr('What reaches each ear', 'Что приходит в каждое ухо')),
        plot,
        h('p', { className: 'mind-note' }, tr(
          'Each ear gets high and low in turn, before and after the swap. Nothing jumps between the ears.',
          'Каждое ухо получает высокий и низкий тон по очереди, до обмена и после. Ничто не прыгает из уха в ухо.')),
        h('button', { type: 'button', className: 'wr-btn wr-btn-quiet mind-go', onclick: start }, tr('Again', 'Ещё раз')));
      view = createCanvas(plot);
      reveal();
      if (!extra) {
        extra = true;
        addToggle(controls, {
          label: tr('Swap left and right', 'Поменять левое и правое'), value: swap,
          onChange: v => { swap = v; },
        });
        addSlider(controls, {
          label: tr('Tone length', 'Длина тона'), min: 100, max: 600, step: 25, value: toneLen * 1000,
          format: v => v + tr(' ms', ' мс'),
          onInput: v => { toneLen = v / 1000; },
        });
      }
    }

    // Two lanes, left and right ear, scrolling: tall blocks are 800 Hz, short ones 400 Hz.
    function drawLanes(v) {
      const { ctx, w, h: hh } = v;
      const fg = cssVar('--text'), muted = cssVar('--text-muted'), line = cssVar('--border'), font = cssVar('--font-mono');
      ctx.clearRect(0, 0, w, hh);
      if (!audio) return;
      const now = sound.ctx.currentTime, span = 3;
      const labelW = 96, x = t => labelW + ((t - (now - span)) / span) * (w - labelW);
      const laneH = hh / 2;
      ctx.font = `400 13px ${font}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      [[tr('Left', 'Левое'), true], [tr('Right', 'Правое'), false]].forEach(([name, isLeft], r) => {
        const base = (r + 1) * laneH - 12, top = r * laneH + 12;
        ctx.fillStyle = muted;
        ctx.fillText(name, 0, (top + base) / 2);
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(labelW, base); ctx.lineTo(w, base); ctx.stroke();
        for (const e of audio.events) {
          if (e.t > now) continue;
          const high = e.leftHigh === isLeft;
          const x0 = Math.max(labelW, x(e.t)), x1 = Math.min(x(now), x(e.t + e.d)) - 2;
          if (x1 <= x0) continue;
          const y = high ? top : (top + base) / 2;
          ctx.fillStyle = fg;
          ctx.fillRect(x0, y, x1 - x0, base - y);
        }
      });
    }
  },
});
