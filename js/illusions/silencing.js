'use strict';

ILLUSIONS.push({
  id: 'motion-silencing',
  title: 'Motion Silencing',
  credit: 'Jordan Suchow & George Alvarez, 2011',
  howto: 'Fix your gaze on the white dot in the centre. The ring alternates: 3 s still, 3 s turning.',
  expect: 'While the ring is still, every dot visibly cycles through colours. When it turns, the dots seem to stop changing, or change far more slowly. They change at exactly the same rate in both phases. Follow one dot with your eyes while it turns: its colour change comes back.',
  why: [
    'Each of the 100 dots cycles through the colour wheel at the rate set below, starting from a random hue. The rate never depends on whether the ring is moving.',
    'Noticing a change requires comparing an object with itself a moment earlier. When objects stand still the comparison is trivial — the same retinal location is compared over time. When a dense crowd of similar objects moves across the retina, the visual system must first work out which dot is which before it can compare them, and in the crowded periphery it fails to. The changes are still registered as the current colours, but not as change.',
    'The effect depends on motion across the retina, not motion in the world: tracking a dot with the eyes keeps it still on the retina and abolishes the silencing. It needs dense displays — it weakens when the dots are spaced more than about half their distance from fixation — and it grows with speed; Suchow & Alvarez found the threshold near 0.2 rotations per second.',
  ],

  mount(stage, controls) {
    const N = 100;
    const PHASE = 3;          // seconds still, then seconds turning
    let speed = 0.4;          // rotations per second while turning
    let rate = 0.5;           // colour cycles per second
    let alternate = true;

    // Random non-overlapping positions in an annulus, in units of ring radius.
    const DOT = 0.055, MIN_DIST = 0.14;
    const rand = rng(11);
    const dots = [];
    while (dots.length < N) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(0.65 ** 2 + rand() * (1.35 ** 2 - 0.65 ** 2));
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (dots.every(d => Math.hypot(d.x - x, d.y - y) >= MIN_DIST)) {
        dots.push({ x, y, hue: rand() * 360 });
      }
    }

    addSlider(controls, {
      label: 'Rotation speed', min: 0.05, max: 1, step: 0.05, value: speed,
      format: v => v.toFixed(2) + ' rev/s',
      onInput: v => { speed = v; },
    });
    addSlider(controls, {
      label: 'Colour change rate', min: 0.1, max: 1.5, step: 0.1, value: rate,
      format: v => v.toFixed(1) + ' cycles/s',
      onInput: v => { rate = v; },
    });
    addToggle(controls, {
      label: 'Alternate still / turning (off: always turning)', value: true,
      onChange: v => { alternate = v; },
    });

    const view = createCanvas(stage);
    const status = addStatus(stage);
    let angle = 0, phase = 0;

    const stop = animate((t, dt) => {
      const { ctx, w, h } = view;
      const m = Math.min(w, h);
      const cx = w / 2, cy = h / 2;
      const ringR = m * 0.3;

      // Turning phases alternate direction; speed eases in and out over 0.3 s.
      let v = speed;
      if (alternate) {
        const k = Math.floor(t / PHASE);
        const p = t - k * PHASE;
        if (k % 2 === 0) v = 0;
        else {
          const ease = Math.min(1, p / 0.3, (PHASE - p) / 0.3);
          v = speed * ease * (k % 4 === 1 ? 1 : -1);
        }
        status.set(k % 2 === 0 ? 'Still' : 'Turning');
      } else status.set('');
      angle += v * Math.PI * 2 * dt;
      phase += rate * 360 * dt;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      const cos = Math.cos(angle), sin = Math.sin(angle);
      for (const d of dots) {
        ctx.fillStyle = `hsl(${(d.hue + phase) % 360}, 95%, 55%)`;
        ctx.beginPath();
        ctx.arc(cx + (d.x * cos - d.y * sin) * ringR, cy + (d.x * sin + d.y * cos) * ringR,
          DOT * ringR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(3, m * 0.006), 0, Math.PI * 2);
      ctx.fill();
    });

    return () => { stop(); status.remove(); view.destroy(); };
  },
});
