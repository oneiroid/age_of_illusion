# Illusions

Eight classic illusions plus one new design, rendered live on `<canvas>`. Vanilla HTML/CSS/JS, no build step, no dependencies.

| # | Illusion | Source | Type |
|---|----------|--------|------|
| 1 | Lilac Chaser | Hinton, 2005 | animated |
| 2 | Motion-Induced Blindness | Bonneh, Cooperman & Sagi, 2001 | animated |
| 3 | Spiral Aftereffect | Addams 1834, Plateau 1850 | animated (30 s adapt / 15 s test loop) |
| 4 | Stepping Feet | Anstis, 2001 | interactive: stripe contrast, speed |
| 5 | Breathing Square | Meyer & Dougherty 1990; Shiffrar & Pavel 1991 | interactive: occluder opacity, gap width |
| 6 | Ghost Word | new design built on reverse phi (Anstis 1970) | interactive: word, step rate, dot size, polarity flip, pause |
| 7 | Rotating Snakes | Kitaoka 2003; Fraser & Wilcox 1979 | static image; interactive: colour, grey steps |
| 8 | Motion Silencing | Suchow & Alvarez, 2011 | animated (3 s still / 3 s turning); interactive: rotation speed, colour change rate |
| 9 | Checker Shadow | Adelson, 1995 | static; interactive: connecting bar, hide scene |

### Разум (Mind, in Russian)

Demos of cognition rather than vision. The outcome and explanation stay hidden until the demo is finished.

| # | Demo | Source | Type |
|---|------|--------|------|
| 10 | Оракул (Oracle) | Shannon 1953; Hagelbarger 1956; Aaronson; data: Guseva et al. 2023 | 200 F/J presses; a model bets on each press beforehand. Round 2 (100 presses) shows each bet after the press |
| 11 | Девяносто процентов (Ninety percent) | Alpert & Raiffa 1969/1982; Fischhoff & Beyth 1975; Hell et al. 1988 | 5 questions: best guess + 90% range, predicted hits, then recall of each guess with the answer shown. Pool of 36 questions; unseen ones first |

See also [`twophase/`](twophase/): a simulation of the DeF Two-Phase Law.

## Run

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8321
```

Keys: `←` `→` or `1`–`9` switch, `F` fullscreen. The URL hash (`#lilac-chaser` etc.) selects an illusion.

## Layout

- `js/core.js` — registry, HiDPI canvas, animation loop, slider helper
- `js/illusions/*.js` — one file per illusion; each pushes `{ id, title, credit, howto, expect, why, mount(stage, controls) }` onto `ILLUSIONS` and returns a cleanup function from `mount`
  (optional `section`, `lang`, `gated`; see the comment in `core.js`)
- `js/mind/*.js` — models behind the Mind demos
- `test/` — `ninety.test.js` (Девяносто процентов: parsing, scoring). Oracle checks: `oracle.test.js` (assertions), `oracle-bench.js` (simulated players),
  `oracle-real.js` (real people; needs the converted data of Guseva et al. 2023, [osf.io/z8rjx](https://osf.io/z8rjx/), CC BY 4.0).
  The model's population prior was fitted on even-numbered participants; `oracle-real.js` scores odd ones.
- `js/app.js` — navigation and panel
