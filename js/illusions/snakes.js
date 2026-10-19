'use strict';

ILLUSIONS.push({
  id: 'rotating-snakes',
  title: 'Rotating Snakes',
  credit: 'Akiyoshi Kitaoka, 2003 · after Fraser & Wilcox, 1979',
  howto: 'Let your eyes wander across the picture, or look at one disc and then at the space beside it. Blinking helps.',
  expect: 'The discs you are not looking at turn slowly, neighbours in opposite directions. The disc you stare at stops. Nothing on the screen moves: this picture is drawn once and never redrawn. Turn off Grey steps: the turning stops.',
  why: [
    'Every ring repeats the same four steps: black, dark (blue), white, light (yellow). The illusory motion runs in that order — from black into the dark step, from white into the light step. Mirror the order and the direction reverses, which is why neighbouring discs turn opposite ways.',
    'High-contrast edges are processed slightly faster than low-contrast ones. When the image lands on a new patch of retina — after a saccade, a blink, or tiny fixational drifts — the black and white parts register a few milliseconds before the grey steps next to them. Motion detectors read that timing difference as movement (Conway et al., 2005; Backus & Oruç, 2005).',
    'Hold your gaze perfectly still and the rotation fades, because no new transients arrive; the effect is strongest in peripheral vision and right after eye movements (Murakami, Kitaoka & Ashida, 2006). Replace both grey steps with the same mid grey and the luminance sequence becomes symmetric, so the timing differences cancel.',
  ],

  mount(stage, controls) {
    let colour = true;
    let steps = true;

    const view = createCanvas(stage, v => draw(v));

    addToggle(controls, {
      label: 'Colour (blue / yellow steps)', value: true,
      onChange: v => { colour = v; draw(); },
    });
    addToggle(controls, {
      label: 'Grey steps', value: true,
      onChange: v => { steps = v; draw(); },
    });

    return () => view.destroy();

    function draw(v = view) {
      const { ctx, w, h } = v;

      // Black, dark step, white, light step. Without the steps both become
      // the same mid grey, so the sequence is symmetric.
      const dark = steps ? (colour ? '#2b3fd8' : '#3a3a3a') : '#808080';
      const light = steps ? (colour ? '#e6dc3c' : '#b8b8b8') : '#808080';
      const seq = ['#000', dark, '#fff', light];
      const width = [1, 2, 1, 2];               // thin edge, wide body
      const unit = width.reduce((a, b) => a + b);

      ctx.fillStyle = '#6f8f3a';
      ctx.fillRect(0, 0, w, h);

      // Grid of discs filling the stage.
      const target = Math.min(w, h) / 2;
      const cols = Math.max(1, Math.round(w / target));
      const rows = Math.max(1, Math.round(h / target));
      const cw = w / cols, ch = h / rows;
      const R = Math.min(cw, ch) * 0.47;
      const RINGS = 4;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = (col + 0.5) * cw, cy = (row + 0.5) * ch;
          const dir = (row + col) % 2 ? -1 : 1;

          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.fill();

          const r0 = R * 0.16;
          const dr = (R - r0) / RINGS;
          for (let k = 0; k < RINGS; k++) {
            const ri = r0 + k * dr + dr * 0.08;
            const ro = r0 + (k + 1) * dr - dr * 0.08;
            const rm = (ri + ro) / 2;
            // Units sized so each body is roughly as long as the ring is thick.
            const n = Math.max(4, Math.round((2 * Math.PI * rm) / (dr * 2.4)));
            const span = (Math.PI * 2) / n;
            const offset = k * span * 0.5;    // stagger rings like bricks
            for (let u = 0; u < n; u++) {
              let a = offset + u * span;
              for (let s = 0; s < 4; s++) {
                const da = (span * width[s]) / unit;
                const a0 = dir > 0 ? a : -a - da;
                ctx.fillStyle = seq[s];
                ctx.beginPath();
                ctx.arc(cx, cy, ro, a0, a0 + da + 0.002);
                ctx.arc(cx, cy, ri, a0 + da + 0.002, a0, true);
                ctx.closePath();
                ctx.fill();
                a += da;
              }
            }
          }

          ctx.fillStyle = '#6f8f3a';
          ctx.beginPath();
          ctx.arc(cx, cy, r0 * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  },
});
