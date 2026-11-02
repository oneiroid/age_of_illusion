'use strict';

ILLUSIONS.push({
  id: 'kinetic-depth',
  title: 'Kinetic Depth',
  credit: 'Wallach & O’Connell, 1953',
  howto: 'Watch the dots. Then try to see the dots moving left as the front surface, then the dots moving right.',
  expect: 'The dots form a solid turning in depth, and after a while it reverses direction, with no change on screen. Pause: the solid goes flat. Turn on Depth cue: near dots get larger and brighter, and only one direction is left.',
  why: [
    'Every dot keeps its height and slides left and right on a flat screen. Dots do not change size, hide each other or carry shading. Depth is absent from any single frame; it is computed from how speed varies across the field, with dots fastest mid-path and slowing to a stop at the edges. The visual system assumes a rigid object, and only a rigid solid in rotation explains those speeds (Ullman 1979).',
    'The projection has no perspective, so it says nothing about which dots are near. A dot in front turning one way draws the same screen path as a dot equally far behind turning the other way. Both solids fit the image equally well. Perception holds one at a time and switches between them, as with other bistable figures.',
    'Depth cue breaks the tie by adding information the projection lacks. Without it, nothing on screen changes when the solid reverses.',
  ],
  ru: {
    title: 'Кинетическая глубина',
    howto: 'Смотрите на точки. Затем попробуйте увидеть передней поверхностью точки, идущие влево, а потом точки, идущие вправо.',
    expect: 'Точки складываются в объёмное тело, которое вращается в глубину, и через некоторое время оно меняет направление, хотя на экране ничего не меняется. Пауза: тело становится плоским. Включите «Подсказка глубины»: ближние точки становятся крупнее и ярче, и остаётся только одно направление.',
    why: [
      'Каждая точка сохраняет высоту и скользит влево и вправо по плоскому экрану. Точки не меняют размер, не заслоняют друг друга и не затенены. В отдельном кадре глубины нет: она вычисляется из того, как скорость меняется по полю, — точки быстрее всего в середине пути и замедляются до остановки на краях. Зрительная система предполагает жёсткий объект, и только вращающееся жёсткое тело объясняет такие скорости (Ullman 1979).',
      'В проекции нет перспективы, поэтому она ничего не говорит о том, какие точки ближе. Точка спереди, вращающаяся в одну сторону, рисует на экране тот же путь, что и точка на том же расстоянии сзади, вращающаяся в другую. Оба тела одинаково хорошо соответствуют изображению. Восприятие удерживает одно из них и переключается между ними, как и в других бистабильных фигурах.',
      'Подсказка глубины разрешает выбор, добавляя информацию, которой в проекции нет. Без неё при смене направления на экране ничего не меняется.',
    ],
  },

  mount(stage, controls) {
    const MAX_DOTS = 3000;
    const SHAPES = [
      { name: tr('Cylinder', 'Цилиндр'), make: cylinder },
      { name: tr('Sphere', 'Сфера'), make: sphere },
      { name: tr('Hoop', 'Обруч'), make: hoop },
      { name: tr('Double helix', 'Двойная спираль'), make: helix },
    ];
    let shape = 0;
    let dots = build(shape);
    let count = 1200;
    let speed = 0.12;         // rotations per second
    let cue = false;
    let paused = false;
    let angle = 0;

    const shapeButton = addButton(controls, {
      label: shapeLabel(),
      onClick: () => {
        shape = (shape + 1) % SHAPES.length;
        dots = build(shape);
        shapeButton.textContent = shapeLabel();
      },
    });
    addSlider(controls, {
      label: tr('Rotation speed', 'Скорость вращения'), min: 0.03, max: 0.4, step: 0.01, value: speed,
      format: v => decimal(v, 2) + tr(' rev/s', ' об/с'),
      onInput: v => { speed = v; },
    });
    addSlider(controls, {
      label: tr('Dots', 'Точки'), min: 100, max: MAX_DOTS, step: 100, value: count,
      onInput: v => { count = v; },
    });
    addToggle(controls, {
      label: tr('Depth cue', 'Подсказка глубины'), value: false,
      onChange: v => { cue = v; },
    });
    addToggle(controls, {
      label: tr('Pause', 'Пауза'), value: false,
      onChange: v => { paused = v; },
    });

    const view = createCanvas(stage);

    const stop = animate((t, dt) => {
      if (!paused) angle += speed * Math.PI * 2 * dt;
      const { ctx, w, h } = view;
      const u = Math.min(w, h);
      const cx = w / 2, cy = h / 2;
      const R = u * 0.38;
      const r = Math.max(1.2, u * 0.0028);
      const c = Math.cos(angle), s = Math.sin(angle);

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      if (!cue) {
        // Orthographic: depth is discarded, every dot looks the same.
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const d = dots[i];
          const x = cx + (d.x * c + d.z * s) * R, y = cy - d.y * R;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
        return;
      }

      // Depth cue: near dots larger and brighter, drawn back to front.
      const view3 = [];
      for (let i = 0; i < count; i++) {
        const d = dots[i];
        view3.push({ x: d.x * c + d.z * s, y: d.y, z: d.z * c - d.x * s });
      }
      view3.sort((a, b) => a.z - b.z);
      for (const d of view3) {
        const near = (d.z + 1) / 2;
        const g = Math.round(70 + 185 * near);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.beginPath();
        ctx.arc(cx + d.x * R, cy - d.y * R, r * (0.6 + 1.2 * near), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    return () => { stop(); view.destroy(); };

    function shapeLabel() {
      return `${tr('Shape', 'Форма')}: ${SHAPES[shape].name}`;
    }

    function build(k) {
      const rand = rng(k + 21);
      return Array.from({ length: MAX_DOTS }, () => SHAPES[k].make(rand));
    }

    function cylinder(rand) {
      const a = rand() * Math.PI * 2;
      return { x: 0.7 * Math.cos(a), y: (rand() * 2 - 1) * 0.9, z: 0.7 * Math.sin(a) };
    }

    function sphere(rand) {
      const a = rand() * Math.PI * 2;
      const y = rand() * 2 - 1;
      const q = Math.sqrt(1 - y * y);
      return { x: q * Math.cos(a), y, z: q * Math.sin(a) };
    }

    // Ring surface facing the viewer at angle 0, spinning like a tossed coin.
    function hoop(rand) {
      const RING = 0.72, TUBE = 0.22;
      let b;
      do b = rand() * Math.PI * 2;
      while (rand() * (RING + TUBE) > RING + TUBE * Math.cos(b));
      const a = rand() * Math.PI * 2;
      const q = RING + TUBE * Math.cos(b);
      return { x: q * Math.cos(a), y: q * Math.sin(a), z: TUBE * Math.sin(b) };
    }

    function helix(rand) {
      const y = rand() * 2 - 1;
      const a = y * Math.PI * 2 + (rand() < 0.5 ? 0 : Math.PI) + (rand() - 0.5) * 0.5;
      const q = 0.6 + (rand() - 0.5) * 0.12;
      return { x: q * Math.cos(a), y, z: q * Math.sin(a) };
    }
  },
});
