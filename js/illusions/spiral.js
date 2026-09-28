'use strict';

ILLUSIONS.push({
  id: 'spiral-aftereffect',
  title: 'Spiral Aftereffect',
  credit: 'Motion aftereffect — Addams 1834 (waterfall), Plateau 1850 (spiral)',
  howto: 'Keep your eyes on the red dot while the spiral turns for 30 seconds. When it stops, keep looking at the dot. Then look at your hand or someone’s face.',
  expect: 'The stopped pattern appears to flow in the opposite direction — shrinking where the spiral seemed to expand — while clearly staying in place. The same drift shows on whatever you look at next, for 5–15 seconds. The test pattern alternates between the frozen spiral and a stone texture.',
  why: [
    'Motion is encoded by populations of direction-selective neurons (in V1 and area MT). Stationary scenes produce a balanced response across neurons tuned to opposite directions, which is read as “no motion”.',
    'Thirty seconds of expansion fatigues the neurons tuned to expansion. When the motion stops, their opposite-tuned counterparts briefly dominate, and the imbalance is read as contraction.',
    'The aftereffect contains motion without any change in position: things appear to move, yet nothing goes anywhere. This shows that motion is signalled by dedicated detectors rather than computed from tracked positions.',
  ],

  mount(stage) {
    const ADAPT = 30, TEST = 15;          // seconds
    const OMEGA = Math.PI * 0.8;          // spiral rotation, rad/s (0.4 rev/s)

    let size, spiral, texture;
    let elapsed = 0, angle = 0;

    const view = createCanvas(stage, v => {
      size = Math.floor(Math.min(v.w, v.h) * 0.86);
      const px = Math.round(size * v.dpr);
      spiral = renderSpiral(px);
      texture = renderTexture(px);
    });
    const status = addStatus(stage);

    const stop = animate((t, dt) => {
      const { ctx, w, h } = view;
      const cx = w / 2, cy = h / 2;
      elapsed += dt;

      const cycle = ADAPT + TEST;
      const n = Math.floor(elapsed / cycle);
      const tc = elapsed - n * cycle;
      const adapting = tc < ADAPT;
      if (adapting) angle += OMEGA * dt;

      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);
      if (adapting || n % 2 === 0) {
        ctx.rotate(angle);
        ctx.drawImage(spiral, -size / 2, -size / 2, size, size);
      } else {
        ctx.drawImage(texture, -size / 2, -size / 2, size, size);
      }
      ctx.restore();

      // Fixation dot
      ctx.fillStyle = '#ff2a2a';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(5, size * 0.012), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Progress arc around the pattern
      const frac = adapting ? tc / ADAPT : (tc - ADAPT) / TEST;
      ctx.strokeStyle = adapting ? 'rgba(255,255,255,0.35)' : 'rgba(224,164,88,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2 + 8, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();

      status.set(adapting
        ? `Adapting — keep looking at the dot · ${Math.ceil(ADAPT - tc)} s`
        : `Stopped — keep looking at the dot · ${Math.ceil(ADAPT + TEST - tc)} s`);
    });

    return () => { stop(); status.remove(); view.destroy(); };

    // Four-armed Archimedean spiral, anti-aliased per pixel, circular.
    function renderSpiral(px) {
      const c = document.createElement('canvas');
      c.width = c.height = px;
      const g = c.getContext('2d');
      const img = g.createImageData(px, px);
      const d = img.data;
      const R = px / 2;
      const ARMS = 4, TURNS = 5;
      const kR = (2 * Math.PI * TURNS) / R;
      for (let y = 0; y < px; y++) {
        const dy = y + 0.5 - R;
        for (let x = 0; x < px; x++) {
          const dx = x + 0.5 - R;
          const r = Math.sqrt(dx * dx + dy * dy);
          const i = (y * px + x) * 4;
          if (r > R) { d[i + 3] = 0; continue; }
          const phase = ARMS * Math.atan2(dy, dx) + kR * r;
          // Phase change per pixel ≈ gradient magnitude; use it to soften the edge to ~1px.
          const grad = Math.hypot(ARMS / Math.max(r, 1e-3), kR);
          const s = Math.max(-1, Math.min(1, Math.sin(phase) / Math.min(grad, 1)));
          const v = 128 + 110 * s;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 255 * Math.min(1, R - r);
        }
      }
      g.putImageData(img, 0, 0);
      return c;
    }

    // Stationary "stone" texture: layered random blobs, clipped to a circle.
    function renderTexture(px) {
      const c = document.createElement('canvas');
      c.width = c.height = px;
      const g = c.getContext('2d');
      const rand = rng(7);
      g.beginPath();
      g.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = '#7a7670';
      g.fillRect(0, 0, px, px);
      const layers = [[160, 0.03, 0.07], [1400, 0.01, 0.022], [7000, 0.003, 0.008]];
      for (const [count, rMin, rMax] of layers) {
        for (let k = 0; k < count; k++) {
          const r = px * (rMin + (rMax - rMin) * rand());
          const l = Math.round(35 + 190 * rand());
          g.fillStyle = `rgb(${l},${Math.round(l * 0.97)},${Math.round(l * 0.92)})`;
          g.beginPath();
          g.ellipse(px * rand(), px * rand(), r, r * (0.55 + 0.45 * rand()), rand() * Math.PI, 0, Math.PI * 2);
          g.fill();
        }
      }
      return c;
    }
  },
});
