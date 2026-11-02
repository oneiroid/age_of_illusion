# Veil

A full-width image backdrop with vignette and film grain, centred on the mirror axis, for heroes, empty states and error pages.

- Provide `src`: one of the `assets/Textures` uploads, normally `mirror-blood`. Use `mirror-print` in Insomnia and `mirror-negative` for an afterimage.
- Provide overlay `children`. A headline with class `wr-veil-title` and one line with class `wr-veil-sub` is the standard content. Text is `on-curtain` over the darkened image.
- Keep overlay content centred so the spike in the texture passes through it.
- Pass `alt` only when the image carries meaning; by default the Veil is decorative.
- Every Veil plays the light arc: the image wakes from black in warm `hearth` light (cozy phase), the warmth drains (cooling), then the light fails on a 9s cycle: a sag, one blink, a two-flash burst, a brownout. Overlay text stays lit and readable throughout.
- `shape` adds a dark, featureless form lying on the floor, cut by the right edge. The room is empty until the first blink; when the light comes back, the form is there, and each cycle it fades just before the next one. Never add detail to it.
- Under reduced motion the Veil shows the end state: dim, cold, with the form present if `shape` is set.
- One Veil per page.
