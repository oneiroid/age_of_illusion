import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** curtain: the one primary action (red fill). quiet: default, bordered. lamp: magenta text action. */
  variant?: "curtain" | "quiet" | "lamp";
  /** One imperative verb: "Stay", "Leave", "Wake up". */
  children: ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;

export interface StampProps {
  /** neutral: index or code. lamp: the live item. curtain: a blocking state. */
  tone?: "neutral" | "lamp" | "curtain";
  /** Adds a flickering round dot before the text. */
  dot?: boolean;
  /** Short uppercase code, e.g. "ROOM 3". */
  children: ReactNode;
  className?: string;
}
export declare function Stamp(props: StampProps): JSX.Element;

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  /** Replaces the hint, prefixed with "Error.", border and text in curtain-text. */
  error?: string;
}
export declare function Field(props: FieldProps): JSX.Element;

export interface QuoteProps {
  /** The quoted words, plain text, no quotation marks. */
  children: ReactNode;
  /** Lowercase mono attribution, e.g. "tape 14, side b". */
  source?: string;
  size?: "m" | "l";
  /** Adds a faint mirrored, reversed copy of the line underneath (string children only). */
  echo?: boolean;
  /** Applies the red and magenta double (ghost-red, ghost-lamp). Once per screen. */
  ghost?: boolean;
  className?: string;
}
export declare function Quote(props: QuoteProps): JSX.Element;

export interface WakeClockProps {
  /** "HH:MM". Defaults to "03:47". Ignored when live is set. */
  time?: string;
  /** Shows the viewer's local time, updated every 20 seconds. */
  live?: boolean;
  /** One line under the hour, e.g. "awake 41 h 12 m". */
  note?: string;
  className?: string;
}
export declare function WakeClock(props: WakeClockProps): JSX.Element;

export interface VeilProps {
  /** Image URL, normally one of the assets/Textures uploads. */
  src: string;
  /** Describe the image only if it carries meaning; otherwise omit and it is decorative. */
  alt?: string;
  /** Minimum height in px. Default 360. */
  height?: number;
  /** Adds an unlit, featureless form lying on the floor at the right edge. It appears only after the first blink of the failing light. */
  shape?: boolean;
  /** Centred overlay content. Use classes wr-veil-title and wr-veil-sub for a headline and a line. */
  children?: ReactNode;
  className?: string;
}
export declare function Veil(props: VeilProps): JSX.Element;

export interface MirrorPanelProps {
  left: ReactNode;
  right: ReactNode;
  label?: string;
  /** Adds lamp-glow. One lit element per screen. */
  lit?: boolean;
  className?: string;
}
export declare function MirrorPanel(props: MirrorPanelProps): JSX.Element;

export interface ChevronRuleProps {
  /** s: 28px band. l: 48px band. */
  pitch?: "s" | "l";
  className?: string;
}
export declare function ChevronRule(props: ChevronRuleProps): JSX.Element;
