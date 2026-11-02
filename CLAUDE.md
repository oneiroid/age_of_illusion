## Design system
- All UI follows the Waking Room design system in `design/waking-room/`. Read `design/waking-room/README.md` before any UI work, and the component README before building or changing that component.
- Colors, spacing, radii, shadows, fonts and timings come only from the CSS variables in `design/waking-room/tokens.css`. Never hardcode a hex value, px spacing outside the scale, or a font name.
- UI copy follows the "Voice and content" section of the README.
- Animations follow the three-phase light arc in the README "Motion" section, and must stop under prefers-reduced-motion.

Exceptions in this app:
- Canvas stimuli keep their own colours, since those colours are the experiment.
- No Veil, WakeClock, flicker or lamp glow next to the stage: changing light beside a stimulus interferes with viewing it.
- Illusion text (`howto`, `expect`, `why`) and the Russian Mind demos keep their factual wording.
