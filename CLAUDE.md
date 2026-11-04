## Design system
- All UI follows the Waking Room design system in `design/waking-room/`. Read `design/waking-room/README.md` before any UI work, and the component README before building or changing that component.
- Colors, spacing, radii, shadows, fonts and timings come only from the CSS variables in `design/waking-room/tokens.css`. Never hardcode a hex value, px spacing outside the scale, or a font name.
- UI copy follows the "Voice and content" section of the README.
- Animations follow the three-phase light arc in the README "Motion" section.

Exceptions in this app:
- Canvas stimuli keep their own colours, since those colours are the experiment.
- prefers-reduced-motion is not honoured: stage animations keep running, overriding the README "Motion" rule.
- Illusion text (`howto`, `expect`, `why`) and the Russian Mind demos keep their factual wording.
- The UI is in English and Russian, not English only. Russian copy addresses the reader as «вы», like the Mind demos.

## Translation
- Visual illusions carry a `ru` block in the descriptor, and strings in `mount` go through `tr(en, ru)`. A new visual illusion needs both.
- Mind demos set `lang: 'ru'` and stay Russian whatever the switcher says.
