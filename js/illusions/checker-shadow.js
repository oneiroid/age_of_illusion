'use strict';

ILLUSIONS.push({
  id: 'checker-shadow',
  title: 'Checker Shadow',
  credit: 'Edward Adelson, 1995',
  howto: 'Compare the square marked A with the square marked B.',
  expect: 'A looks dark grey, B looks almost white. They are the same grey: both are drawn with identical pixel values. Turn on Connecting bar or Hide the scene to see it.',
  why: [
    'The eye receives luminance — light reflected toward it — but what we perceive is lightness, an estimate of the surface’s paint. A shadow dims everything inside it, so a white square in shadow can send less light than a dark square in full light. To report paint rather than light, the visual system discounts the shadow, and here that makes two equal patches look very different.',
    'Local contrast: B is surrounded by darker squares, A by lighter ones. A square lighter than its neighbours is probably a light square, whatever the lighting, so B is pushed up and A down.',
    'Edge type: the shadow has a soft, gradual border while the checks meet in sharp edges and X-shaped junctions. The visual system treats gradual changes as illumination and sharp ones as paint, so it attributes the darkness around B to light, not to the squares. Remove the context (Hide the scene) and only the luminance remains: the two squares match.',
  ],

  mount(stage, controls) {
    const N = 5;
    const LIGHT = 228, DARK = 118;      // paint values; B = LIGHT · SHADE = DARK
    const SHADE = DARK / LIGHT;
    const A = [1, 2], B = [3, 3];       // [i, j] board squares
    const CYL = { u: 4.3, v: 1.7, r: 0.7, h: 2.3 };
    // Shadow: soft capsule from the cylinder base toward the near-left corner.
    // B lies inside the flat core; A lies outside core + soft edge.
    const SH0 = [CYL.u, CYL.v], SH1 = [3.5, 5], CORE = 1.0, SOFT = 0.85;

    let bar = false, hide = false;
    let shadowCanvas = null;

    const view = createCanvas(stage, v => { shadowCanvas = null; draw(v); });

    addToggle(controls, {
      label: 'Connecting bar (same grey)', value: false,
      onChange: v => { bar = v; draw(); },
    });
    addToggle(controls, {
      label: 'Hide the scene', value: false,
      onChange: v => { hide = v; draw(); },
    });

    return () => view.destroy();

    function draw(v = view) {
      const { ctx, w, h } = v;
      const s = Math.min(w / (N * 2 + 1.2), h / (N * 1.1 + 3.6));   // px per board unit
      const ox = w / 2, oy = (h - s * (N * 1.1 + 0.6)) / 2 + s * 0.2;
      const P = (u, vv) => [ox + (u - vv) * s, oy + (u + vv) * s * 0.55];
      const grey = g => `rgb(${g},${g},${g})`;
      const quad = (pts, fill) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
      };
      const square = (i, j) => [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
      const paint = (i, j) => ((i + j) % 2 ? DARK : LIGHT);
      const centre = ([i, j]) => P(i + 0.5, j + 0.5);

      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(0, 0, w, h);

      // Board sides (thickness 0.35 units), darker than the top.
      const T = s * 0.35;
      for (let k = 0; k < N; k++) {
        const fr = [P(N, k), P(N, k + 1)];       // right-front side
        quad([fr[0], fr[1], [fr[1][0], fr[1][1] + T], [fr[0][0], fr[0][1] + T]],
          grey(Math.round(paint(N - 1, k) * 0.62)));
        const fl = [P(k, N), P(k + 1, N)];       // left-front side
        quad([fl[0], fl[1], [fl[1][0], fl[1][1] + T], [fl[0][0], fl[0][1] + T]],
          grey(Math.round(paint(k, N - 1) * 0.45)));
      }

      // Top face. 0.5 px overdraw hides seams between squares.
      ctx.lineJoin = 'round';
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          ctx.strokeStyle = grey(paint(i, j));
          ctx.lineWidth = 0.6;
          quad(square(i, j), grey(paint(i, j)));
          ctx.stroke();
        }
      }

      // Shadow, multiplied onto the top face.
      if (!shadowCanvas) shadowCanvas = makeShadow(w, h, s, ox, oy);
      ctx.save();
      ctx.beginPath();
      [P(0, 0), P(N, 0), P(N, N), P(0, N)].forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip();
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(shadowCanvas, 0, 0, w, h);
      ctx.restore();

      // B sits fully inside the flat core of the shadow; repaint it with the
      // exact value so rounding in the blend cannot make it differ from A.
      quad(square(...B), grey(DARK));
      quad(square(...A), grey(DARK));

      drawCylinder(ctx, P, s);

      if (hide) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        for (const sq of [A, B]) {
          square(...sq).forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
        }
        ctx.fillStyle = '#5a5a5a';
        ctx.fill('evenodd');
        ctx.restore();
      }

      if (bar) {
        const [ax, ay] = centre(A), [bx, by] = centre(B);
        ctx.strokeStyle = grey(DARK);
        ctx.lineWidth = s * 0.32;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      // Labels
      ctx.font = `600 ${Math.round(s * 0.42)}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f2f2f2';
      ctx.fillText('A', ...centre(A));
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText('B', ...centre(B));
    }

    // Per-pixel shadow factor (255 = no shadow) at half resolution; it is
    // smooth, so it is scaled up with smoothing.
    function makeShadow(w, h, s, ox, oy) {
      const k = 0.5;
      const cw = Math.ceil(w * k), ch = Math.ceil(h * k);
      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      const g = c.getContext('2d');
      const img = g.createImageData(cw, ch);
      const d = img.data;
      const [x0, y0] = SH0, [x1, y1] = SH1;
      const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy;
      for (let py = 0; py < ch; py++) {
        for (let px = 0; px < cw; px++) {
          // Screen -> board coordinates (inverse of P).
          const a = (px / k - ox) / s, b = (py / k - oy) / (s * 0.55);
          const u = (a + b) / 2, vv = (b - a) / 2;
          const t = ((u - x0) * dx + (vv - y0) * dy) / len2;
          const tc = Math.max(0, Math.min(1, t));
          let dist = Math.hypot(u - (x0 + tc * dx), vv - (y0 + tc * dy));
          // Behind the cylinder (toward the light) the shadow ends quickly.
          if (t < 0) dist += -t * Math.sqrt(len2) * 3;
          let m = 1 - (dist - CORE) / SOFT;
          m = Math.max(0, Math.min(1, m));
          m = m * m * (3 - 2 * m);                       // smoothstep edge
          const val = Math.round(255 * (1 - (1 - SHADE) * m));
          const i = (py * cw + px) * 4;
          d[i] = d[i + 1] = d[i + 2] = val;
          d[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
      return c;
    }

    function drawCylinder(ctx, P, s) {
      const [cx, cy] = P(CYL.u, CYL.v);
      const rx = CYL.r * s * Math.SQRT2, ry = rx * 0.55;
      const H = CYL.h * s;
      const grad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      grad.addColorStop(0, '#1d4a1f');
      grad.addColorStop(0.55, '#3f8a3c');
      grad.addColorStop(0.85, '#6fc265');
      grad.addColorStop(1, '#4e9a48');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
      ctx.lineTo(cx - rx, cy - H);
      ctx.ellipse(cx, cy - H, rx, ry, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7fcf73';
      ctx.beginPath();
      ctx.ellipse(cx, cy - H, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});
