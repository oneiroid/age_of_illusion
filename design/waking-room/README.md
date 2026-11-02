# Waking Room

Waking Room is for interfaces that should feel like the third night without sleep. The reader stands in a red-curtained waiting room with a zigzag floor, lit by one sick magenta lamp, and every surface is folded along a vertical axis so that each thing has a double. Nothing jumps out. The fear comes from flat statements, symmetry that is slightly off, and a clock that keeps saying the same hour.

## Principles

1. **Everything has a double.** Layouts are mirrored around a visible vertical axis (a `blade` rule, the `MirrorPanel` spike, the spike in the textures). The two sides match in structure, and one detail on the right side is wrong: a different time, a missing word, a reversed line.
2. **Red is a room.** `curtain` fills full-height slabs, full-bleed bands and the primary button. It never appears as a thin accent, a border or a small badge, except the `curtain` Stamp for a blocking state.
3. **One lamp.** `lamp` marks the single live thing on a screen. If two things glow, turn one off.
4. **Darkness by default.** Lodge is the default theme. At least 70% of any screen is `background`. Insomnia exists for people who cannot sleep with the lights off, and it should feel just as wrong.
5. **Say it flat.** The copy never raises its voice. Short declarative sentences state things that should not be true, in the tone of a log entry.

## Voice and content

- Write in English, sentence case, plain words. Second person ("you") in the UI, impersonal log style in system messages.
- No exclamation marks, no emoji, no jokes, no horror vocabulary ("terrifying", "evil", "nightmare"). Fear comes from what is stated, never from adjectives about it.
- Use exact times, usually between 02:00 and 04:59. Repeat a time when something happens twice.
- Contradict gently. A message may state a fact and then a second fact that does not quite agree with it.
- Buttons are one imperative verb: "Save", "Stay", "Leave", "Wake up".
- `stamp` text is uppercase mono. Everything else is sentence case.

| Situation | Copy |
| --- | --- |
| Empty list | "Nothing is here. Something was." |
| Loading | "Still awake. Loading." |
| Error | "That did not save. It may have saved somewhere else. Try again." |
| Destructive confirm | "Delete this? It will not come back the same." |
| Success | "Done. You can close your eyes now." |
| Not found | "This room is not here. You have been here before." |
| Session timeout | "You were gone for 41 minutes. The page was not." |
| Form hint | "Use the name you were given, not the one you remember." |

## Color

- Set `background` on the page, `surface` on panels and inputs, `text` for primary text and `text-muted` for everything secondary.
- `curtain` is a fill with `on-curtain` text on it. For red words use `curtain-text`. `curtain-deep` is hover, pressed and the shadow side of red bands.
- `lamp` is for links, the focus ring and the one selected or live item. Put `lamp-soft` behind a selected row.
- `floor-light` and `floor-dark` exist only together, inside `ChevronRule` and the cover.
- `marble` is for the oversized hour in `WakeClock` and one display glyph on Lodge. `silver` and `blade` belong to the mirror axis.
- Control borders use `border-strong`. `border` is decorative only.

## Typography

- `display` is IM Fell English: old, uneven ink, slightly wrong at large sizes. `text` is Libre Franklin. `mono` is Courier Prime and stands for tape transcripts and typed reports. All three load from Google Fonts.
- `display-xl` appears once per page at most. `display-l` opens sections, empty states and error pages. `heading` names pages and panels.
- `quote` is italic and only appears inside `Quote`.
- Running text is `body` at 60–68ch. Hints and table cells are `body-s` in `text-muted`.
- `transcript` sets logs and notes. Prefix each entry with its time: "03:47. Still here."
- Apply the ghost text-shadow (`ghost-red` with `ghost-lamp`, class `wr-ghost`) to one display line per screen, so it looks doubled. Never on body text.

## Space, layout and shape

- Spacing steps are `space-4`, `space-8`, `space-12`, `space-16`, `space-24`, `space-40`, `space-64`. Use no other values.
- Desktop pages use a centred 12-column grid with the axis between columns 6 and 7, and `space-64` reserved for the axis zone.
- Leave large empty areas of `background`. Content sits low or close to the axis, never evenly spread.
- Every surface and control uses `radius-0`. Inputs and stamps may use `radius-2`. Only the lamp dot uses `radius-round`.
- Depth comes from `background` to `surface`, the `fold` shadow on red, and `lamp-glow` on the one lit element.

## Imagery

- Use the mirrored print textures in `textures/`. They are the main imagery of the system.
- `mirror-blood` is the default backdrop for heroes, empty states and error pages. `mirror-band` is a wide crop for headers. `mirror-print` is the original monochrome print for Insomnia. `mirror-negative` is the inverted print for afterimages: a page reached after an error, or the right side of a doubled pair.
- Always show the textures through `Veil`, which adds grain and a vignette and keeps the axis centred. Never crop the spike off-centre and never flip the image upside down.
- Do not use photographs of people, faces or recognisable places. Do not draw figures or scenes. The only figure-like element is the Veil `shape`: a featureless dark form on the floor, cut by the frame edge, never detailed and never explained.
- Do not use gradients other than the Veil vignette.
- `hearth` is warm lamplight that exists only in the first seconds of an animation. Never use it as a static color.

## Motion

Every animation tells the same story in three phases: a warm room, the warmth leaving, and a light that keeps failing in a room where something is lying on the floor. The opening is warm and slow so that the ending lands harder.

1. **Cozy.** Elements arrive from black, warm and soft. `wr-cozy-in` runs over `cozy-duration` with `cozy-ease`: opacity up, a sepia `hearth` glow, a 4px settle. Hover fills use the same easing over 900ms.
2. **Cooling.** Over `cool-duration` the `hearth` tint drains out and the light turns cold and dimmer. Nothing moves. Only the temperature changes.
3. **Failing.** From `dread-delay` on, the light runs an endless `flicker-duration` (9s) cycle: a slow sag, one blink, a two-flash burst, a brownout, then false calm. The cycle is irregular on purpose, so the viewer cannot predict the next blink.

- `Veil` plays the full arc on its image. With `shape`, the room is empty until the first blink, and when the light returns a dark form is lying at the right edge of the floor. It fades just before each new cycle and is back after the next blink.
- `WakeClock` and the Stamp `dot` play the arc on the colon and the dot. The clock hour only browns out.
- Buttons fill slowly, then dim twice once per hover. Focus rings arrive at once, blink out twice and stay.
- Use the class `wr-enter` on any element that should arrive warm and stutter once at the end.
- Reveals open from the axis outward, like curtains parting.
- Never shake, scale, rotate or jump-scare. The dread comes from the light alone.
- Photosensitivity: at most two flashes in any one second, and blinks only dim the light layer; they never flash the screen to white or to saturated red. Do not shorten `flicker-duration`.
- Text stays readable in every phase. Overlay text sits above the light layer and does not flicker.
- Under `prefers-reduced-motion: reduce`, nothing animates. Elements appear in their final state, and a `Veil` shows the room as it ends: dim, cold and, with `shape`, not empty.

## Iconography

- No icon set came with this system. Use geometric glyphs drawn with 1.5px strokes in `text` or `lamp`: a spike (tall thin triangle), a chevron, a square, a dot. Flag any third-party icon set before adding it.
- There is no logo. Set "Waking Room" in `display-xl` or `heading` and do not draw a mark.

## Accessibility

- Every interactive element shows a 2px solid `focus` ring with 2px offset. It holds 3:1 on both grounds in both themes.
- Text pairs named in token notes hold 4.5:1 or more in both themes. `curtain` on Lodge background is 2.4:1 and is never text.
- Red and magenta never carry meaning alone. Errors start with the word "Error", and selected items carry a stamp or weight change as well as `lamp`.
- Reversed or doubled text (Quote `echo`, the ghost shadow) is decoration and is hidden from assistive technology.
