/**
 * Semantic tones used for pills, bars and glows. Each tone has a foreground
 * color and a translucent tint used as the pill background.
 * Values mirror the tokens in src/app/globals.css.
 */
export type Tone = { fg: string; tint: string };

export const T = {
  red: { fg: "#F26B5E", tint: "rgba(242,107,94,.13)" },
  blue: { fg: "#6FA4FA", tint: "rgba(76,141,246,.14)" },
  amber: { fg: "#F5B13D", tint: "rgba(245,177,61,.12)" },
  mint: { fg: "#1FE0A0", tint: "rgba(31,224,160,.12)" },
  grey: { fg: "#B4BCC5", tint: "rgba(255,255,255,.07)" },
} satisfies Record<string, Tone>;

export type ToneName = keyof typeof T;

/** Raw hex values for places that need a color string (SVG, glows). */
export const C = {
  mint: "#1FE0A0",
  red: "#F26B5E",
  amber: "#F5B13D",
  blue: "#6FA4FA",
  blueDeep: "#4C8DF6",
  fg: "#E8ECEF",
  fgStrong: "#F2F5F7",
  fg2: "#C9D0D6",
  fg3: "#B4BCC5",
  muted: "#9BA4AE",
  muted2: "#8A939D",
  dim: "#6B7480",
  off: "#4A535E",
} as const;
