'use strict';

ILLUSIONS.push({
  id: 'stepping-feet',
  title: 'Stepping Feet',
  credit: 'Stuart Anstis, 2001',
  howto: 'Look at the stripes midway between the two blocks, not directly at them.',
  expect: 'The blocks seem to walk: one lurches ahead while the other lags, alternating like a pair of feet. Drag Stripe contrast to 0 — they move together at one constant speed the whole time.',
  why: [
    'Perceived speed depends on contrast: a low-contrast edge looks slower than a high-contrast edge moving at the same speed.',
    'The block length equals one black + white stripe pair, so both of a block’s edges are always on the same stripe colour. The pale yellow block is low-contrast over white stripes and high-contrast over black ones; the dark blue block is the reverse. Each block therefore seems to speed up and slow down, and the two do so in antiphase.',
    'The effect is strongest in peripheral vision, where the speed estimate relies more on these contrast-dependent motion signals and less on tracking position.',
  ],
  ru: {
    title: 'Шагающие ступни',
    howto: 'Смотрите на полосы посередине между двумя блоками, а не прямо на блоки.',
    expect: 'Блоки будто шагают: один рывком уходит вперёд, другой отстаёт, и они чередуются, как пара ступней. Сдвиньте «Контраст полос» до 0: всё это время они двигались вместе с одной постоянной скоростью.',
    why: [
      'Воспринимаемая скорость зависит от контраста: край с низким контрастом выглядит медленнее края с высоким контрастом, движущегося с той же скоростью.',
      'Длина блока равна одной паре чёрной и белой полос, поэтому оба края блока всегда находятся на полосах одного цвета. Бледно-жёлтый блок низкоконтрастен на белых полосах и высококонтрастен на чёрных; у тёмно-синего блока наоборот. Поэтому каждый блок будто то ускоряется, то замедляется, причём в противофазе с другим.',
      'Эффект сильнее всего в периферическом зрении, где оценка скорости больше опирается на такие зависящие от контраста сигналы движения и меньше на отслеживание положения.',
    ],
  },

  mount(stage, controls) {
    let contrast = 1;
    let speed = 45;           // px/s
    let x = null;            // travelled distance, px

    addSlider(controls, {
      label: tr('Stripe contrast', 'Контраст полос'), min: 0, max: 100, value: 100,
      format: v => v + '%',
      onInput: v => { contrast = v / 100; },
    });
    addSlider(controls, {
      label: tr('Speed', 'Скорость'), min: 10, max: 150, value: speed,
      format: v => v + tr(' px/s', ' пикс/с'),
      onInput: v => { speed = v; },
    });

    const view = createCanvas(stage);

    const stop = animate((t, dt) => {
      const { ctx, w, h } = view;
      const sw = Math.round(Math.max(8, Math.min(22, Math.min(w, h) * 0.028)));
      const bw = sw * 2;      // block length = one full stripe period
      if (x === null) x = w * 0.25 + bw;
      x += speed * dt;

      const hi = Math.round(255 * (0.5 + 0.5 * contrast));
      const lo = Math.round(255 * (0.5 - 0.5 * contrast));
      ctx.fillStyle = `rgb(${hi},${hi},${hi})`;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `rgb(${lo},${lo},${lo})`;
      for (let sx = sw; sx < w; sx += sw * 2) ctx.fillRect(sx, 0, sw, h);

      const bh = Math.round(sw * 1.4);
      const gap = sw * 4;
      const span = w + bw;
      const px = (x % span) - bw;

      ctx.fillStyle = '#ffe94d';
      ctx.fillRect(px, h / 2 - gap / 2 - bh, bw, bh);
      ctx.fillStyle = '#1b2a8f';
      ctx.fillRect(px, h / 2 + gap / 2, bw, bh);
    });

    return () => { stop(); view.destroy(); };
  },
});
