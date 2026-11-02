'use strict';

ILLUSIONS.push({
  id: 'motion-induced-blindness',
  title: 'Motion-Induced Blindness',
  credit: 'Bonneh, Cooperman & Sagi, 2001',
  howto: 'Look steadily at the flashing green dot in the centre. Keep your eyes still for at least 15 seconds.',
  expect: 'The three yellow dots vanish — one at a time, in pairs, or all three — for several seconds, then reappear. They never change on screen.',
  why: [
    'The yellow dots are bright, high-contrast and stationary, yet the rotating blue pattern makes them drop out of awareness. The dots are still processed by early visual areas; they are lost at a later stage that decides what reaches conscious perception.',
    'One explanation is competition: the moving field and the stationary targets are treated as rival interpretations, as in binocular rivalry, and the dominant moving surface suppresses the dots. Another is that the brain treats a perfectly stationary spot inside a moving scene as a defect on the retina and fills it in with the surrounding pattern.',
    'Dots disappear more often when they are further from fixation and when the pattern moves faster. They reappear briefly if the pattern is stopped, or if a dot is flashed.',
  ],
  ru: {
    title: 'Слепота, вызванная движением',
    howto: 'Неотрывно смотрите на мигающую зелёную точку в центре. Не двигайте глазами хотя бы 15 секунд.',
    expect: 'Три жёлтые точки исчезают — по одной, парами или все сразу — на несколько секунд, затем появляются снова. На экране они не меняются.',
    why: [
      'Жёлтые точки яркие, контрастные и неподвижные, но вращающийся синий узор вытесняет их из осознания. Ранние зрительные области продолжают их обрабатывать; точки теряются на более позднем этапе, который определяет, что дойдёт до сознательного восприятия.',
      'Одно из объяснений — конкуренция: движущееся поле и неподвижные цели воспринимаются как соперничающие интерпретации, как при бинокулярной конкуренции, и доминирующая движущаяся поверхность подавляет точки. Другое объяснение: мозг принимает идеально неподвижное пятно внутри движущейся сцены за дефект сетчатки и заполняет его окружающим узором.',
      'Точки исчезают чаще, когда они дальше от точки фиксации и когда узор движется быстрее. Они ненадолго появляются снова, если узор остановить или если точка мигнёт.',
    ],
  },

  mount(stage) {
    const OMEGA = 1.9;       // grid rotation, rad/s
    let angle = 0;

    const view = createCanvas(stage);

    const stop = animate((t, dt) => {
      const { ctx, w, h } = view;
      const m = Math.min(w, h);
      const cx = w / 2, cy = h / 2;
      angle += OMEGA * dt;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // Rotating grid of blue crosses, covering the whole stage.
      const sp = m * 0.075;
      const arm = sp * 0.26;
      const reach = Math.hypot(w, h) / 2 + sp;
      const k = Math.ceil(reach / sp);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.strokeStyle = '#2f58ff';
      ctx.lineWidth = Math.max(2, m * 0.006);
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = -k; i <= k; i++) {
        for (let j = -k; j <= k; j++) {
          const x = i * sp, y = j * sp;
          if (x * x + y * y > reach * reach) continue;
          ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
          ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Three stationary yellow targets.
      const r = m * 0.25;
      const dotR = Math.max(4, m * 0.011);
      ctx.fillStyle = '#ffe600';
      for (const deg of [-90, 30, 150]) {
        const a = deg * Math.PI / 180;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dotR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flashing fixation point (on 350 ms / off 150 ms).
      if (t % 0.5 < 0.35) {
        ctx.fillStyle = '#19e05a';
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(3.5, m * 0.008), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    return () => { stop(); view.destroy(); };
  },
});
