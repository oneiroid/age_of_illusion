'use strict';

ILLUSIONS.push({
  id: 'double-drift',
  title: 'Double Drift',
  credit: 'Tse & Hsieh 2006; Shapiro et al. 2010; Lisi & Cavanagh 2015',
  howto: 'Fix your gaze on the black dot in the centre. Keep it there and watch the two striped patches from the corner of your eye.',
  expect: 'The patches seem to travel on slanted paths that lean together at the top, like an upside-down V. Both paths are vertical and parallel: turn on True paths to see them, or set Stripe drift to 0. Look straight at a patch and the slant shrinks. To measure the effect, raise Path tilt until the paths look parallel.',
  why: [
    'Each patch has two independent motions: its soft-edged window slides straight up and down, and the stripes inside the window drift sideways, reversing at each end of the path. The left and right patches are mirror images. Nothing on screen moves along a slanted path.',
    'A soft-edged patch in peripheral vision has a poorly defined position, so the visual system estimates where it is partly from how it seems to be moving. The sideways stripe motion is added to the estimate over time, and the patch appears to wander off its true path, by 45° or more with suitable speeds (Lisi & Cavanagh 2015). The reversal at each end resets the error, so the percept is a straight slanted line rather than a growing drift. Looking directly at the patch gives a precise position, and the error mostly disappears.',
    'The effect grows with stripe speed and shrinks with window speed. Quick eye movements aimed at the patch tend to land on its true path, not the path you see (Lisi & Cavanagh 2015): the position that guides the eyes can differ from the one you perceive.',
  ],
  ru: {
    title: 'Двойной дрейф',
    howto: 'Смотрите на чёрную точку в центре. Не отводите взгляд и следите за двумя полосатыми пятнами краем глаза.',
    expect: 'Пятна будто движутся по наклонным путям, которые сходятся вверху, как перевёрнутая V. Оба пути вертикальны и параллельны: включите «Настоящие пути», чтобы их увидеть, или поставьте «Дрейф полос» на 0. Посмотрите прямо на пятно, и наклон уменьшится. Чтобы измерить эффект, увеличивайте «Наклон пути», пока пути не покажутся параллельными.',
    why: [
      'У каждого пятна два независимых движения: его окно с мягкими краями скользит строго вверх и вниз, а полосы внутри окна дрейфуют вбок и меняют направление на концах пути. Левое и правое пятна зеркальны. На экране ничего не движется по наклонному пути.',
      'Положение пятна с мягкими краями в периферическом зрении определено плохо, поэтому зрительная система оценивает его отчасти по тому, как пятно кажется движущимся. Боковое движение полос со временем добавляется к оценке, и пятно будто уходит с настоящего пути, при подходящих скоростях на 45° и больше (Lisi & Cavanagh 2015). Разворот на каждом конце сбрасывает ошибку, поэтому видна прямая наклонная линия, а не нарастающий снос. Если смотреть прямо на пятно, его положение определяется точно и ошибка почти исчезает.',
      'Эффект растёт со скоростью полос и падает со скоростью окна. Быстрые движения глаз к пятну обычно попадают на его настоящий путь, а не на тот, что вы видите (Lisi & Cavanagh 2015): положение, которое направляет глаза, может отличаться от воспринимаемого.',
    ],
  },

  mount(stage, controls) {
    const STROKE = 1.2;       // seconds per end-to-end sweep
    const CONTRAST = 0.75;
    let rate = 4;             // stripe cycles per second
    let tilt = 0;             // degrees, tops of the paths apart
    let showPaths = false;

    let u, sigma, lambda, radius, size, patch, pctx, img, env, stripes;
    let s = -1, dir = 1, phase = 0;

    const view = createCanvas(stage, rebuild);

    addSlider(controls, {
      label: tr('Stripe drift', 'Дрейф полос'), min: 0, max: 8, step: 0.5, value: rate,
      format: v => decimal(v, 1) + tr(' Hz', ' Гц'),
      onInput: v => { rate = v; },
    });
    addSlider(controls, {
      label: tr('Path tilt (tops apart)', 'Наклон пути (верх врозь)'), min: 0, max: 60, value: tilt,
      format: v => v + '°',
      onInput: v => { tilt = v; },
    });
    addToggle(controls, {
      label: tr('True paths', 'Настоящие пути'), value: false,
      onChange: v => { showPaths = v; },
    });

    const stop = animate((t, dt) => {
      s += dir * dt * 2 / STROKE;
      if (Math.abs(s) >= 1) {
        s = dir * (2 - Math.abs(s));
        dir = -dir;
      }
      phase += dir * rate * Math.PI * 2 * dt;
      renderPatch();

      const { ctx, w, h } = view;
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);

      // Left patch; the right one is its mirror image about the centre line.
      const a = tilt * Math.PI / 180;
      const L = 0.1 * u;
      const x0 = cx - 0.35 * w;
      for (const mirror of [false, true]) {
        ctx.save();
        if (mirror) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }
        if (showPaths) {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0 - L * Math.sin(a), cy - L * Math.cos(a));
          ctx.lineTo(x0 + L * Math.sin(a), cy + L * Math.cos(a));
          ctx.stroke();
        }
        const x = x0 - s * L * Math.sin(a), y = cy - s * L * Math.cos(a);
        ctx.drawImage(patch, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
      }

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(3, u * 0.006), 0, Math.PI * 2);
      ctx.fill();
    });

    return () => { stop(); view.destroy(); };

    function rebuild(v) {
      u = Math.min(v.w, v.h);
      sigma = Math.max(8, u * 0.024);
      lambda = sigma * 1.8;
      radius = sigma * 3.2;
      size = Math.ceil(radius * 2 * v.dpr);
      patch = document.createElement('canvas');
      patch.width = patch.height = size;
      pctx = patch.getContext('2d');
      img = pctx.createImageData(size, size);
      stripes = new Float32Array(size);
      env = new Float32Array(size * size);
      const c = (size - 1) / 2, sd = sigma * v.dpr;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          env[y * size + x] = Math.exp(-((x - c) ** 2 + (y - c) ** 2) / (2 * sd * sd));
        }
      }
    }

    // Gaussian window over vertical stripes; the window is fixed in the patch.
    function renderPatch() {
      const k = Math.PI * 2 / (lambda * view.dpr);
      for (let x = 0; x < size; x++) stripes[x] = Math.sin(k * x - phase);
      const d = img.data;
      for (let y = 0, i = 0; y < size; y++) {
        for (let x = 0; x < size; x++, i += 4) {
          const l = 128 + 127 * CONTRAST * env[y * size + x] * stripes[x];
          d[i] = d[i + 1] = d[i + 2] = l;
          d[i + 3] = 255;
        }
      }
      pctx.putImageData(img, 0, 0);
    }
  },
});
