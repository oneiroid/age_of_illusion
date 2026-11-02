'use strict';

ILLUSIONS.push({
  id: 'ghost-word',
  title: 'Ghost Word',
  credit: 'New design for this app, 2026 · built on reverse phi (Anstis, 1970)',
  howto: 'Watch the noise from a normal viewing distance. Every dot on screen steps to the right.',
  expect: 'A word appears, its texture streaming left, though no dot ever moves left. Pause: every single frame is uniform noise, and the word is gone. Turn off Polarity flip: the whole field drifts right and the word is gone.',
  why: [
    'Motion detectors compare light and dark at neighbouring positions across successive moments. If a pattern steps right and at the same time swaps black and white, the strongest light-to-light and dark-to-dark matches point left, so the detectors signal leftward motion. This is reverse phi (Anstis, 1970).',
    'Inside the letters the dots step right and swap polarity on every step; outside they only step right. Every frame is 50 % black / 50 % white random noise everywhere, and every dot changes colour with the same 50 % probability per step inside and outside the letters. The word is absent from any single frame and from any single dot’s flicker. It exists only in the direction of motion.',
    'The visual system groups regions by their motion direction — the way a camouflaged animal becomes visible the moment it moves — so the left-drifting region is seen as a shape, and you can read it.',
  ],
  ru: {
    title: 'Слово-призрак',
    credit: 'Новый дизайн для этого приложения, 2026 · на основе обратного фи-движения (Anstis, 1970)',
    howto: 'Смотрите на шум с обычного расстояния. Каждая точка на экране шагает вправо.',
    expect: 'Появляется слово, текстура которого течёт влево, хотя ни одна точка влево не движется. Пауза: каждый отдельный кадр — однородный шум, и слова нет. Выключите «Смена полярности»: всё поле дрейфует вправо, и слова нет.',
    why: [
      'Детекторы движения сравнивают свет и тьму в соседних положениях в последовательные моменты. Если узор шагает вправо и одновременно меняет чёрное на белое, самые сильные совпадения светлого со светлым и тёмного с тёмным указывают влево, и детекторы сигнализируют о движении влево. Это обратное фи-движение (Anstis, 1970).',
      'Внутри букв точки шагают вправо и меняют полярность на каждом шаге; снаружи они только шагают вправо. Каждый кадр везде состоит из случайного шума, 50 % чёрного и 50 % белого, и каждая точка меняет цвет с одной и той же вероятностью 50 % за шаг внутри и снаружи букв. Слова нет ни в отдельном кадре, ни в мерцании отдельной точки. Оно существует только в направлении движения.',
      'Зрительная система группирует области по направлению движения — так замаскированное животное становится видно в момент, когда шевельнётся, — поэтому область, дрейфующая влево, видится как фигура, и её можно прочитать.',
    ],
  },

  mount(stage, controls) {
    let word = tr('GHOST', 'ПРИЗРАК');
    let rate = 20;            // steps per second
    let cell = 3;             // dot size, CSS px
    let flip = true;
    let paused = false;

    let vw, vh, gw, gh, noise, mask, img, grid, gctx;
    let step = 0, acc = 0;

    const view = createCanvas(stage, v => { vw = v.w; vh = v.h; rebuild(); });

    addText(controls, {
      label: tr('Word', 'Слово'), value: word, maxLength: 12,
      onInput: v => { word = v.trim().toUpperCase() || ' '; buildMask(); render(); },
    });
    addSlider(controls, {
      label: tr('Step rate', 'Частота шагов'), min: 4, max: 60, value: rate,
      format: v => v + tr(' Hz', ' Гц'),
      onInput: v => { rate = v; },
    });
    addSlider(controls, {
      label: tr('Dot size', 'Размер точки'), min: 2, max: 8, value: cell,
      format: v => v + tr(' px', ' пикс'),
      onInput: v => { if (v !== cell) { cell = v; rebuild(); } },
    });
    addToggle(controls, {
      label: tr('Polarity flip inside the word', 'Смена полярности внутри слова'), value: true,
      onChange: v => { flip = v; },
    });
    addToggle(controls, {
      label: tr('Pause', 'Пауза'), value: false,
      onChange: v => { paused = v; },
    });

    const stop = animate((t, dt) => {
      if (!paused) {
        acc += dt;
        const period = 1 / rate;
        if (acc >= period) {
          acc %= period;
          step++;
          render();
        }
      }
      const { ctx } = view;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(grid, 0, 0, gw * cell, gh * cell);
    });

    return () => { stop(); view.destroy(); };

    function rebuild() {
      gw = Math.ceil(vw / cell);
      gh = Math.ceil(vh / cell);
      noise = new Uint8Array(gw * gh);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random() < 0.5 ? 1 : 0;
      grid = document.createElement('canvas');
      grid.width = gw;
      grid.height = gh;
      gctx = grid.getContext('2d');
      img = gctx.createImageData(gw, gh);
      buildMask();
      render();
    }

    // Word rendered at grid resolution; mask[i] = 1 inside the letters.
    function buildMask() {
      const c = document.createElement('canvas');
      c.width = gw;
      c.height = gh;
      const g = c.getContext('2d');
      const font = size => `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
      let size = gh * 0.5;
      g.font = font(size);
      const tw = g.measureText(word).width;
      if (tw > gw * 0.86) size *= (gw * 0.86) / tw;
      g.font = font(size);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#fff';
      g.fillText(word, gw / 2, gh / 2);
      const a = g.getImageData(0, 0, gw, gh).data;
      mask = new Uint8Array(gw * gh);
      for (let i = 0; i < mask.length; i++) mask[i] = a[i * 4 + 3] > 127 ? 1 : 0;
    }

    // Frame `step`: noise shifted right by `step` cells; inside the mask,
    // polarity is inverted on odd steps.
    function render() {
      const d = img.data;
      const odd = step & 1;
      const shift = step % gw;
      for (let y = 0; y < gh; y++) {
        const row = y * gw;
        for (let x = 0; x < gw; x++) {
          let sx = x - shift;
          if (sx < 0) sx += gw;
          let v = noise[row + sx];
          if (flip && odd && mask[row + x]) v ^= 1;
          const i = (row + x) * 4;
          const l = v ? 235 : 20;
          d[i] = d[i + 1] = d[i + 2] = l;
          d[i + 3] = 255;
        }
      }
      gctx.putImageData(img, 0, 0);
    }
  },
});
