# Illusions

Five classic motion illusions plus one new design, rendered live on `<canvas>`. Vanilla HTML/CSS/JS, no build step, no dependencies.

| # | Illusion | Source | Type |
|---|----------|--------|------|
| 1 | Lilac Chaser | Hinton, 2005 | animated |
| 2 | Motion-Induced Blindness | Bonneh, Cooperman & Sagi, 2001 | animated |
| 3 | Spiral Aftereffect | Addams 1834, Plateau 1850 | animated (30 s adapt / 15 s test loop) |
| 4 | Stepping Feet | Anstis, 2001 | interactive: stripe contrast, speed |
| 5 | Breathing Square | Meyer & Dougherty 1990; Shiffrar & Pavel 1991 | interactive: occluder opacity, gap width |
| 6 | Ghost Word | new design built on reverse phi (Anstis 1970) | interactive: word, step rate, dot size, polarity flip, pause |

## Run

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8321
```

Keys: `←` `→` or `1`–`6` switch, `F` fullscreen. The URL hash (`#lilac-chaser` etc.) selects an illusion.

## Layout

- `js/core.js` — registry, HiDPI canvas, animation loop, slider helper
- `js/illusions/*.js` — one file per illusion; each pushes `{ id, title, credit, howto, expect, why, mount(stage, controls) }` onto `ILLUSIONS` and returns a cleanup function from `mount`
- `js/app.js` — navigation and panel
