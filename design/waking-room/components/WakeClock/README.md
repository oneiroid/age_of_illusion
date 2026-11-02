# WakeClock

An oversized hour in marble display numerals with a flickering colon and one mono line beneath, for dashboards, empty states and session screens.

- Provide `time` ("03:47") or set `live` to show the viewer's local time. Default is 03:47.
- `note` is one line in the log voice: "awake 41 h 12 m", "same hour as yesterday".
- One WakeClock per screen. It is the screen's single display element; no `display-xl` beside it.
- Under reduced motion nothing moves. Screen readers get the time and note once.
- The hour fades in warm, then browns out once per cycle. The colon follows the failing-light cycle: a sag, one blink, a two-flash burst.
