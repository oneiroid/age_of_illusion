'use strict';

ILLUSIONS.push({
  id: 'lilac-chaser',
  title: 'Lilac Chaser',
  credit: 'Jeremy Hinton, 2005',
  howto: 'Fix your gaze on the black cross in the centre and hold it there for 20–30 seconds without moving your eyes.',
  expect: 'The gap turns into a green disc running around the ring. With steady fixation the pink discs fade away completely, leaving only the green disc on grey.',
  why: [
    'Negative afterimage: each pink disc adapts the patch of retina it falls on. When that disc vanishes, the adapted patch sees the grey background tinted with the complementary colour, green. There is no green anywhere on the screen.',
    'Apparent motion: the gap jumps to the next position every 0.1 s. The visual system links the successive green afterimages into one moving object, the same mechanism that turns film frames into motion.',
    'Troxler fading: blurry, unchanging stimuli away from the point of fixation stop being signalled after a few seconds, so the pink discs disappear while the moving green afterimage stays visible.',
  ],

  mount(stage) {
    const N = 12;
    const STEP = 0.1;          // seconds each gap lasts
    const BG = '#bdbdbd';
    const DISC = [226, 104, 226];

    let sprite, ringR, blobR;

    const view = createCanvas(stage, v => {
      const m = Math.min(v.w, v.h);
      ringR = m * 0.34;
      blobR = ringR * 0.24;
      sprite = makeBlob(Math.ceil(blobR * v.dpr), DISC);
    });

    const stop = animate(t => {
      const { ctx, w, h } = view;
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      const gap = Math.floor(t / STEP) % N;
      for (let i = 0; i < N; i++) {
        if (i === gap) continue;
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * ringR, y = cy + Math.sin(a) * ringR;
        ctx.drawImage(sprite, x - blobR, y - blobR, blobR * 2, blobR * 2);
      }

      const c = Math.max(7, Math.min(w, h) * 0.014);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - c, cy); ctx.lineTo(cx + c, cy);
      ctx.moveTo(cx, cy - c); ctx.lineTo(cx, cy + c);
      ctx.stroke();
    });

    return () => { stop(); view.destroy(); };

    // Gaussian-blurred disc, pre-rendered once per size.
    function makeBlob(r, [R, G, B]) {
      const c = document.createElement('canvas');
      c.width = c.height = r * 2;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(r, r, 0, r, r, r);
      const edge = Math.exp(-3);
      for (let i = 0; i <= 20; i++) {
        const s = i / 20;
        const a = (Math.exp(-3 * s * s) - edge) / (1 - edge);
        grad.addColorStop(s, `rgba(${R},${G},${B},${a.toFixed(3)})`);
      }
      g.fillStyle = grad;
      g.fillRect(0, 0, r * 2, r * 2);
      return c;
    }
  },
});
