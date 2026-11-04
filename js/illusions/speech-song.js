'use strict';

ILLUSIONS.push({
  id: 'speech-to-song',
  section: 'ear',
  gated: true,
  title: 'Speech to Song',
  credit: 'Deutsch, 1995; Deutsch, Henthorn & Lapidis, 2011; Tierney et al., 2013',
  howto: 'Allow the microphone. Say one short phrase in your ordinary voice, two or three seconds, as if talking to someone. Then rate how it sounds, listen to it repeat ten times, and rate it again.',
  expect: 'The first time, the phrase sounds like talk. After a few repetitions most people start to hear it sung: the syllables take on notes, and the rhythm becomes a beat. Once it has happened, the phrase is hard to hear as plain speech again, even played once. Turn on Shift each repeat: when the pitch moves from one repetition to the next, the change usually does not come.',
  why: [
    'Diana Deutsch found the effect by chance in 1995, while editing a recording of her own voice: a looped phrase, “sometimes behave so strangely”, began to sing.',
    'Speech has pitch, but it glides, and while we follow words we hardly track exact pitches. Repetition uses up the meaning, and the contour, identical every time, becomes the thing left to follow. One account is that listening tuned to music then takes over and hears the glides as notes.',
    'In Deutsch, Henthorn & Lapidis (2011), listeners rated a phrase as speech on first hearing and as song after ten repetitions. When each repetition was transposed, or its syllables were played in a different order, the change did not happen. Exact repetition is what matters.',
    'Some phrases turn into song more easily than others. The ones that do have steadier pitch within each syllable (Tierney et al., 2013).',
  ],
  ru: {
    title: 'Речь становится песней',
    credit: 'Deutsch, 1995; Deutsch, Henthorn & Lapidis, 2011; Tierney et al., 2013',
    howto: 'Разрешите доступ к микрофону. Скажите одну короткую фразу обычным голосом, две-три секунды, как будто говорите с кем-то. Затем оцените, как она звучит, послушайте её десять раз подряд и оцените ещё раз.',
    expect: 'В первый раз фраза звучит как разговор. После нескольких повторов большинство начинает слышать её пропетой: слоги получают ноты, ритм становится тактом. Когда это случилось, фразу трудно снова услышать простой речью, даже если проиграть её один раз. Включите «Сдвигать каждый повтор»: если высота меняется от повтора к повтору, превращение обычно не наступает.',
    why: [
      'Дайана Дойч нашла эффект случайно в 1995 году, монтируя запись собственного голоса: зацикленная фраза «sometimes behave so strangely» («иногда ведут себя так странно») запела.',
      'У речи есть высота, но она скользит, и, следя за словами, мы почти не отслеживаем точные высоты. Повторы исчерпывают смысл, и контур, каждый раз одинаковый, становится тем, за чем остаётся следить. Одно из объяснений: тогда включается слушание, настроенное на музыку, и скольжения слышатся нотами.',
      'В работе Deutsch, Henthorn & Lapidis (2011) слушатели оценивали фразу как речь при первом прослушивании и как пение после десяти повторов. Когда каждый повтор транспонировали или переставляли в нём слоги, превращения не было. Важно именно точное повторение.',
      'Одни фразы превращаются в песню легче других. У тех, что превращаются, высота внутри каждого слога ровнее (Tierney et al., 2013).',
    ],
  },

  mount(stage, controls, { reveal }) {
    const REPEATS = 10;
    const MAX_REC = 6;        // seconds
    let gap = 2.3;            // seconds of silence between repetitions
    let shift = false;

    let clip = null;          // trimmed AudioBuffer of the phrase
    let ratings = [];
    let loop = null;          // { left, next, onDone } while repeating
    let plays = [];           // [{ t, d }] repetitions started, for the playhead
    let rec = null;           // { stream, recorder, analyser, timer } while recording
    let view = null, meter = null, counter = null, extra = false;

    const root = h('div', { className: 'mind' });
    stage.appendChild(root);
    const sound = createSound(stage, controls, { gate: false, pause: false });

    const stopLoop = animate(() => {
      if (loop) tickLoop();
      if (rec && meter) meter.style.width = Math.min(100, level() * 400) + '%';
      if (view) drawWave(view);
    });

    intro();

    return () => {
      stopLoop();
      stopRecording(false);
      loop = null;
      if (view) view.destroy();
      sound.destroy();
      root.remove();
    };

    function screen(...children) {
      if (view) { view.destroy(); view = null; }
      meter = counter = null;
      root.replaceChildren(h('div', { className: 'mind-col' }, ...children));
    }

    function intro(error) {
      screen(
        h('p', { className: 'mind-big' }, tr('Say one phrase', 'Скажите одну фразу')),
        h('p', { className: 'mind-sub' }, tr(
          'Two or three seconds, in your ordinary voice, as if talking to someone. For example: “The light in the hall stays on all night.”',
          'Две-три секунды, обычным голосом, как будто говорите с кем-то. Например: «В коридоре всю ночь горит свет».')),
        error && h('p', { className: 'mind-note' }, error),
        h('button', { type: 'button', className: 'wr-btn wr-btn-curtain mind-go', onclick: record }, tr('Record', 'Записать')),
        h('p', { className: 'mind-note' }, tr(
          'The recording stays in this tab. It is not sent anywhere and is gone when you leave.',
          'Запись остаётся в этой вкладке. Она никуда не отправляется и исчезает, когда вы уходите.')));
    }

    async function record() {
      const ctx = sound.ensure();
      if (!ctx || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        intro(tr('Error. This browser cannot record here. Recording works on https pages in recent browsers.',
          'Ошибка. Этот браузер не может здесь записывать. Запись работает на страницах https в свежих браузерах.'));
        return;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
      } catch (e) {
        intro(tr('Error. The microphone was not allowed. Allow it in the address bar and try again.',
          'Ошибка. Доступ к микрофону не разрешён. Разрешите его в адресной строке и попробуйте снова.'));
        return;
      }
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        try {
          const raw = await ctx.decodeAudioData(await new Blob(chunks).arrayBuffer());
          clip = trim(ctx, raw);
        } catch (e) {
          clip = null;
        }
        if (!clip) intro(tr('Nothing was heard. Speak a little louder or closer, and record again.',
          'Ничего не слышно. Скажите чуть громче или ближе и запишите снова.'));
        else listenOnce();
      };
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      rec = { stream, recorder, analyser, timer: setTimeout(() => stopRecording(true), MAX_REC * 1000) };
      recorder.start();

      meter = h('i');
      const m = meter;
      screen(
        h('p', { className: 'mind-step stamp' }, tr('Recording', 'Идёт запись')),
        h('p', { className: 'mind-big' }, tr('Speak now', 'Говорите')),
        h('div', { className: 'ear-meter' }, m),
        h('button', { type: 'button', className: 'wr-btn wr-btn-curtain mind-go', onclick: () => stopRecording(true) }, tr('Stop', 'Стоп')),
        h('p', { className: 'mind-note' }, tr(`Stops by itself after ${MAX_REC} seconds.`, `Остановится само через ${MAX_REC} секунд.`)));
      meter = m;
    }

    function level() {
      const a = rec.analyser, d = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(d);
      return Math.sqrt(d.reduce((s, v) => s + v * v, 0) / d.length);
    }

    function stopRecording(keep) {
      if (!rec) return;
      const { stream, recorder, timer } = rec;
      rec = null;
      clearTimeout(timer);
      if (!keep) recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
      stream.getTracks().forEach(t => t.stop());
    }

    // Cut silence at both ends, normalise the peak, fade the edges.
    function trim(ctx, raw) {
      const d = raw.getChannelData(0), sr = raw.sampleRate, frame = Math.round(0.02 * sr);
      const rms = [];
      for (let i = 0; i + frame <= d.length; i += frame) {
        let e = 0;
        for (let j = i; j < i + frame; j++) e += d[j] * d[j];
        rms.push(Math.sqrt(e / frame));
      }
      const max = Math.max(0, ...rms);
      if (max < 0.003) return null;
      const on = rms.findIndex(v => v > max * 0.08);
      const off = rms.length - 1 - [...rms].reverse().findIndex(v => v > max * 0.08);
      const pad = Math.round(0.06 * sr);
      const a = Math.max(0, on * frame - pad), b = Math.min(d.length, (off + 1) * frame + pad);
      if ((b - a) / sr < 0.4) return null;
      let peak = 0;
      for (let i = a; i < b; i++) peak = Math.max(peak, Math.abs(d[i]));
      const out = ctx.createBuffer(1, b - a, sr), o = out.getChannelData(0), fade = Math.round(0.01 * sr);
      for (let i = 0; i < b - a; i++) {
        const env = Math.min(1, i / fade, (b - a - 1 - i) / fade);
        o[i] = d[a + i] * (0.9 / peak) * env;
      }
      return out;
    }

    // One playback at audio time t; with Shift on, a random transposition of 1–3 semitones.
    function playAt(t, transpose) {
      const src = sound.ctx.createBufferSource();
      src.buffer = clip;
      let cents = 0;
      if (transpose) cents = (Math.random() < 0.5 ? -1 : 1) * (100 + Math.round(Math.random() * 200));
      src.detune.value = cents;
      src.connect(sound.out);
      src.start(t);
      const d = clip.duration / 2 ** (cents / 1200);
      plays.push({ t, d });
      if (plays.length > 4) plays.shift();
      return d;
    }

    function startLoop(times, onDone) {
      loop = { left: times, next: sound.ctx.currentTime + 0.2, done: 0, onDone, end: 0 };
    }

    function tickLoop() {
      const t = sound.ctx.currentTime;
      if (loop.left > 0 && loop.next < t + 0.2) {
        const d = playAt(loop.next, shift);
        loop.left--;
        loop.done++;
        loop.end = loop.next + d;
        loop.next += d + gap;
      }
      if (counter) counter.textContent = tr(`Repetition ${loop.done} of ${loop.done + loop.left}`, `Повтор ${loop.done} из ${loop.done + loop.left}`);
      if (loop.left === 0 && t > loop.end + 0.3) {
        const done = loop.onDone;
        loop = null;
        if (done) done();
      }
    }

    function scale(onPick) {
      return [
        h('div', { className: 'ear-scale' }, [1, 2, 3, 4, 5].map(v =>
          h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', onclick: () => onPick(v) }, v))),
        h('div', { className: 'ear-scale-ends' }, h('span', null, tr('speech', 'речь')), h('span', null, tr('song', 'песня'))),
      ];
    }

    function waveBox() {
      const box = h('div', { className: 'ear-canvas short' });
      return box;
    }

    function listenOnce() {
      ratings = [];
      const box = waveBox();
      const ask = h('div', { hidden: true },
        h('p', { className: 'mind-sub' }, tr('How did it sound?', 'Как это прозвучало?')),
        ...scale(v => { ratings[0] = v; repeat(); }));
      screen(
        h('p', { className: 'mind-step stamp' }, tr('Step 1 of 3', 'Шаг 1 из 3')),
        h('p', { className: 'mind-big' }, tr('Listen once', 'Послушайте один раз')),
        box, ask,
        h('button', { type: 'button', className: 'wr-btn wr-btn-lamp mind-go', onclick: () => intro() }, tr('Record again', 'Записать заново')));
      view = createCanvas(box);
      startLoop(1, () => { ask.hidden = false; });
    }

    function repeat() {
      const box = waveBox();
      counter = h('p', { className: 'mind-big' });
      const c = counter;
      screen(
        h('p', { className: 'mind-step stamp' }, tr('Step 2 of 3', 'Шаг 2 из 3')),
        c,
        box,
        h('p', { className: 'mind-sub' }, tr('Just listen.', 'Просто слушайте.')));
      counter = c;
      view = createCanvas(box);
      startLoop(REPEATS, rateAgain);
    }

    function rateAgain() {
      screen(
        h('p', { className: 'mind-step stamp' }, tr('Step 3 of 3', 'Шаг 3 из 3')),
        h('p', { className: 'mind-big' }, tr('How does it sound now?', 'Как это звучит теперь?')),
        ...scale(v => { ratings[1] = v; result(); }));
    }

    function result() {
      const [r1, r2] = ratings;
      const head = r2 > r1 ? tr(`Toward song: ${r1} → ${r2}`, `Ближе к песне: ${r1} → ${r2}`)
        : r2 < r1 ? tr(`Toward speech: ${r1} → ${r2}`, `Ближе к речи: ${r1} → ${r2}`)
        : tr(`No change: ${r1} → ${r2}`, `Без изменений: ${r1} → ${r2}`);
      const box = waveBox();
      screen(
        h('p', { className: 'mind-step stamp' }, tr('Result', 'Результат')),
        h('p', { className: 'mind-big' }, head),
        h('p', { className: 'mind-sub' }, tr(
          'The recording did not change between the first hearing and the tenth. Play it once now, as at the start.',
          'Запись не менялась от первого прослушивания до десятого. Проиграйте её сейчас один раз, как в начале.')),
        box,
        h('div', { className: 'ear-actions' },
          h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', onclick: () => startLoop(1) }, tr('Play once', 'Один раз')),
          h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', onclick: () => startLoop(REPEATS) }, tr('Repeat', 'Повторять')),
          h('button', { type: 'button', className: 'wr-btn wr-btn-quiet', onclick: () => { loop = null; } }, tr('Stop', 'Стоп'))),
        h('button', { type: 'button', className: 'wr-btn wr-btn-lamp mind-go', onclick: () => { loop = null; intro(); } }, tr('Record a new phrase', 'Записать новую фразу')));
      view = createCanvas(box);
      reveal();
      if (!extra) {
        extra = true;
        addToggle(controls, {
          label: tr('Shift each repeat', 'Сдвигать каждый повтор'), value: false,
          onChange: v => { shift = v; },
        });
        addSlider(controls, {
          label: tr('Pause between repeats', 'Пауза между повторами'), min: 0.5, max: 4, step: 0.1, value: gap,
          format: v => decimal(v, 1) + tr(' s', ' с'),
          onInput: v => { gap = v; },
        });
      }
    }

    // Waveform of the phrase with a playhead.
    function drawWave(v) {
      const { ctx, w, h: hh } = v;
      ctx.clearRect(0, 0, w, hh);
      if (!clip) return;
      const d = clip.getChannelData(0), mid = hh / 2;
      ctx.fillStyle = cssVar('--text');
      const step = d.length / w;
      for (let x = 0; x < w; x++) {
        let lo = 0, hi = 0;
        for (let i = Math.floor(x * step), e = Math.floor((x + 1) * step); i < e; i += 4) {
          if (d[i] < lo) lo = d[i];
          if (d[i] > hi) hi = d[i];
        }
        ctx.fillRect(x, mid - hi * mid, 1, Math.max(1, (hi - lo) * mid));
      }
      const t = sound.ctx ? sound.ctx.currentTime : 0;
      const p = plays.find(q => q.t <= t && t < q.t + q.d);
      if (p) {
        ctx.fillStyle = cssVar('--lamp');
        ctx.fillRect(((t - p.t) / p.d) * w - 1, 0, 2, hh);
      }
    }
  },
});
