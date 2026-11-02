# Button

A square, flat button in three variants: `curtain` for the single primary action, `quiet` for everything else, `lamp` for a text action.

- Provide one imperative verb as `children`: "Stay", "Leave", "Wake up".
- Use `curtain` at most once per view. Hover and press sink it into `curtain-deep` with the `fold` shadow, slowly (480ms).
- `quiet` is the default. Its border is `border-strong`.
- `lamp` has no box and sits inside text or as a tertiary action.
- No icons before the label. A trailing chevron glyph is allowed for navigation.
- Hover fills slowly over 900ms with `cozy-ease`, then the button dims twice in quick succession, as if the bulb above it hesitated. This plays once per hover. The focus ring arrives at once, holds, blinks out twice and stays.
