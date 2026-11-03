/**
 * Mistless design system — PulseBuddy visual language (Oct 31, 2026).
 *
 * Ram directed a 1:1 match of the PulseBuddy Dribbble shot (Phenomenon
 * Studio) for Mistless: a LIGHT pastel theme. Pale lavender fields,
 * white cards at 20–28px radii, pill-shaped controls, a charcoal ink,
 * periwinkle as the primary action color, warm peach for needs-
 * attention states, pale blue-white for calm states, small green
 * checks for completed/logged items, and soft pastel gradients
 * throughout — low contrast, calming, never neon.
 *
 * Type: Nunito, a rounded geometric sans, throughout (PulseBuddy uses
 * a rounded sans; Fraunces/Archivo are retired from the UI). Bold
 * friendly headings, very large bold hero numbers, small gray
 * captions for units and timestamps.
 *
 * The color KEYS are unchanged from the previous theme so every
 * component re-skins through the tokens; the values are the new
 * palette. Legacy key meanings in the new system:
 *   pine       -> periwinkle primary (actions, active states, links)
 *   pineDeep   -> deep violet-charcoal (hero numbers, headline ink)
 *   pineSoft   -> pale periwinkle tint (calm fills, selected chips)
 *   amber      -> warm peach (attention, SOS, highlights)
 *   amberBright-> brighter peach (attention fills, big accents)
 *   amberSoft  -> pale peach tint (attention card fills)
 *   clay       -> dusty rose (slips: marked, never alarm-red)
 *   line       -> soft lavender hairlines on white
 */
export const colors = {
  // Very pale lavender page background; white raised surfaces.
  bg: '#EDECF9',
  surface: '#FFFFFF',
  surfaceMuted: '#E3E2F5',

  // Periwinkle / violet family: the PulseBuddy primary.
  pine: '#7576AA',
  pineDeep: '#2A2A2D',
  pineSoft: '#D8D7F6',

  // Ink: near-black charcoal, muted violet-gray secondary.
  ink: '#2A2A2D',
  inkMuted: '#7576AA',
  inkFaint: '#A7A9C9',

  // Hairlines and borders: soft lavender.
  line: '#E1E0F2',
  lineStrong: '#C9C8E8',

  // Warm peach: needs-attention accent (SOS, streak marks, seals).
  amber: '#E08A4C',
  amberBright: '#F2A65A',
  amberSoft: '#FBE9D7',

  // Slips in a dusty rose, never alarm-red.
  clay: '#B06A7E',
  claySoft: '#F6E1E6',

  white: '#FFFFFF',

  // PulseBuddy-named tokens for the new components.
  lavender: '#D8D7F6',
  periwinkle: '#A7A9DF',
  violetGray: '#7576AA',
  mauveGray: '#857CA2',
  charcoal: '#2A2A2D',
  /** Small green checks: completed / logged states. */
  check: '#58B368',
  checkSoft: '#DFF2E2',
  /** Pale blue-white: the calm / okay state. */
  calmSoft: '#EAF1FB',
};

export const fonts = {
  display: 'Nunito_800ExtraBold',
  displayBold: 'Nunito_900Black',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_600SemiBold',
  bodySemiBold: 'Nunito_700Bold',
  bodyBold: 'Nunito_800ExtraBold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
};

/**
 * Soft pastel gradient pairs (start -> end) used across the app:
 * page washes, the status blob, chart fills, seals. Always low
 * contrast; two stops from the same pastel family.
 */
export const gradients = {
  /** Calm / okay: pale blue-white into pale lavender. */
  calm: ['#EAF1FB', '#D8D7F6'] as const,
  /** Primary: periwinkle into lavender. */
  primary: ['#A7A9DF', '#D8D7F6'] as const,
  /** Deeper primary for hero bands: violet-gray into periwinkle. */
  hero: ['#7576AA', '#A7A9DF'] as const,
  /** Needs attention: warm peach into soft yellow. */
  warm: ['#F6C177', '#FBE3B9'] as const,
  /** SOS / urgent-warm: peach into pale peach. */
  sos: ['#F2A65A', '#F6C177'] as const,
  /** Chart line: peach into lavender (the PulseBuddy signature). */
  chartLine: ['#F2A65A', '#A7A9DF'] as const,
  /** Full-bleed onboarding wash. */
  onboarding: ['#A7A9DF', '#D8D7F6'] as const,
};
