# Stamp

A small uppercase mono label for room numbers, status codes and indices, like a typed tag on an evidence bag.

- Provide a code of three words or fewer: "ROOM 3", "AWAKE", "TAPE 14".
- `tone="neutral"` is the default. `tone="lamp"` marks the one live item. `tone="curtain"` marks a blocking state and is the only small red element allowed.
- `dot` adds a lamp dot that flickers on the `flicker-duration` cycle. The text must still carry the meaning.
- A Stamp is never a button.
- The `dot` fades in warm over `cozy-duration`, then follows the failing-light cycle (`flicker-duration`) forever.
