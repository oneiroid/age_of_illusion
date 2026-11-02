# Applying Waking Room to a codebase

## What is in this folder

| File | Use |
| --- | --- |
| `README.md` | The brand book: principles, voice, color, type, layout, imagery, motion, accessibility. Agents read this first. |
| `tokens.json` | Source of truth for every token (colors per theme, type, spacing, radius, shadow, effect). |
| `tokens.css` | The same tokens compiled to CSS custom properties, two themes (`data-theme="lodge"` default, `"insomnia"`), one class per text style, Google Fonts import. |
| `components.css` | Styles and keyframes for the components and the light arc (`wr-` prefix). |
| `components/waking-room.js` | Reference React 18 implementation, a plain script that sets `window.WakingRoom`. |
| `components/waking-room.d.ts` | Props of every component. |
| `components/<Name>/README.md` | Usage rules per component. |
| `textures/` | The four mirrored-print images. |
| `demo.html` | Open in a browser to see everything working, with a theme switch. |

## Steps in Claude Code

1. Copy this folder into the repository, for example to `design/waking-room/`.
2. Add these lines to the repository's `CLAUDE.md`:

```markdown
## Design system
- All UI follows the Waking Room design system in `design/waking-room/`. Read `design/waking-room/README.md` before any UI work, and the component README before building or changing that component.
- Colors, spacing, radii, shadows, fonts and timings come only from the CSS variables in `design/waking-room/tokens.css`. Never hardcode a hex value, px spacing outside the scale, or a font name.
- UI copy follows the "Voice and content" section of the README.
- Animations follow the three-phase light arc in the README "Motion" section, and must stop under prefers-reduced-motion.
```

3. Start a session in the repository and ask for an audit first, then a plan:

```text
Read design/waking-room/README.md, tokens.css and components/*/README.md.
Then audit this codebase's current styling: where colors, fonts, spacing and
components are defined, which framework is used (CSS modules, Tailwind,
styled-components, a component library). Map each existing style value and
component to a Waking Room token or component, list what has no equivalent,
and propose a migration plan in small steps. Do not change files yet.
```

4. Review the plan, then let it migrate step by step. A typical order:
   - Load `tokens.css` globally and set `data-theme="lodge"` on `<html>`.
   - Replace hardcoded values with the variables (or map them into the Tailwind theme, see below).
   - Rebuild shared components (Button, Field, ...) in the codebase's own framework, using `components/waking-room.js` and `components.css` as the reference. Do not ship the reference script as is unless the app is plain React 18.
   - Rewrite UI copy in the system's voice.
   - Add Veil, WakeClock and the light arc only where the README allows them: heroes, empty states, error pages, session screens.
5. After each step, ask Claude Code to run the app and check both themes, contrast, and reduced motion.

## Tailwind

If the codebase uses Tailwind, ask Claude Code to map the variables into the theme instead of copying values, so the CSS file stays the single source:

```text
Extend the Tailwind theme so colors, spacing, borderRadius, boxShadow and fontFamily
point to the var(--…) custom properties from design/waking-room/tokens.css.
Keep only the Waking Room spacing scale.
```

## Keeping the system and the code in sync

The design system also lives as an artifact on claude.ai. If you edit it there, copy the changed files into the repository again. If the code becomes the source of truth later, Claude Code's `/design-sync` command can build the artifact from the codebase instead.
