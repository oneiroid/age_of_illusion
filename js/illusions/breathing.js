'use strict';

ILLUSIONS.push({
  id: 'breathing-square',
  title: 'Breathing Square',
  credit: 'Meyer & Dougherty, 1990; Shiffrar & Pavel, 1991',
  howto: 'Watch the blue shape in the cross-shaped gap between the orange squares.',
  expect: 'The blue shape seems to swell and shrink, as if breathing, while it turns. Lower Occluder opacity: it is a rigid square rotating at a constant speed.',
  why: [
    'Only short pieces of the square’s edges are visible through the arms of the cross. A straight edge seen through a narrow opening has ambiguous motion — any movement along the edge is invisible (the aperture problem) — so each piece only signals motion perpendicular to itself.',
    'As the square turns, those pieces slide in and out along the arms. Without the corners to tie them together, the visual system does not recover a single rigid rotation; it combines the local signals into a shape whose size pulsates.',
    'Once the corners become visible — through semi-transparent occluders, or through a wide gap — they provide unambiguous motion signals and the square snaps back to rigid rotation. Narrow gaps give the strongest breathing; at intermediate settings perception can flip between the two.',
  ],

  mount(stage, controls) {
    const OMEGA = 0.6;        // rad/s
    let opacity = 1;
    let gapFrac = 0.18;
    let angle = 0;

    addSlider(controls, {
      label: 'Occluder opacity', min: 0, max: 100, value: 100,
      format: v => v + '%',
      onInput: v => { opacity = v / 100; },
    });
    addSlider(controls, {
      label: 'Gap width', min: 8, max: 50, value: 18,
      format: v => v + '%',
      onInput: v => { gapFrac = v / 100; },
    });

    const view = createCanvas(stage);

    const stop = animate((t, dt) => {
      const { ctx, w, h } = view;
      const m = Math.min(w, h) * 0.92;
      const cx = w / 2, cy = h / 2;
      angle += OMEGA * dt;

      ctx.fillStyle = '#efeee9';
      ctx.fillRect(0, 0, w, h);

      // Window arms end at H with S/2 < H < S/√2: the square's edges always
      // cross the arms; its corners stay hidden unless the gap is wide (> ~38%).
      const S = m * 0.76;
      const H = S * 0.66;
      const g = m * gapFrac / 2;          // half gap

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = '#2d56d8';
      ctx.fillRect(-S / 2, -S / 2, S, S);
      ctx.restore();

      // Occluder: everything except the cross-shaped window.
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#e08a3c';
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      const cross = [
        [g, -H], [g, -g], [H, -g], [H, g], [g, g], [g, H],
        [-g, H], [-g, g], [-H, g], [-H, -g], [-g, -g], [-g, -H],
      ];
      cross.forEach(([x, y], k) => (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + x, cy + y));
      ctx.closePath();
      ctx.fill('evenodd');
      ctx.globalAlpha = 1;

      // Hairlines marking the four occluder squares.
      ctx.strokeStyle = `rgba(120,60,10,${0.35 * opacity})`;
      ctx.lineWidth = 1;
      for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const x0 = cx + sx * g, y0 = cy + sy * g;
        ctx.strokeRect(Math.min(x0, x0 + sx * (H - g)), Math.min(y0, y0 + sy * (H - g)), H - g, H - g);
      }
    });

    return () => { stop(); view.destroy(); };
  },
});
