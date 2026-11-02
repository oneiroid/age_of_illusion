# Field

A labelled single-line text input with an optional hint or error line.

- Provide `label` (sentence case, no colon) and any input props.
- `hint` is one sentence in `text-muted`. It may contradict expectations gently: "Use the name you were given, not the one you remember."
- `error` replaces the hint, starts with "Error." and turns the border `curtain-text`. Two flat sentences: what happened, what to do.
