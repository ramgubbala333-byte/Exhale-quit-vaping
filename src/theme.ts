/**
 * Exhale design system.
 *
 * Palette: deep pine + warm off-white + one restrained amber accent.
 * Type: Fraunces (display serif, loaded via @expo-google-fonts/fraunces)
 *       Archivo (body grotesque, loaded via @expo-google-fonts/archivo).
 * The font family constants below must match the names registered in
 * app/_layout.tsx where the fonts are loaded.
 */
export const colors = {
  // Warm off-white page background and raised surfaces.
  bg: '#F7F3EB',
  surface: '#FFFDF8',
  surfaceMuted: '#EFE9DB',

  // Deep pine green: primary brand / dark sections / primary buttons.
  pine: '#14453D',
  pineDeep: '#0C2E28',
  pineSoft: '#DCE8E0',

  // Ink for text.
  ink: '#1E2A26',
  inkMuted: '#68736C',
  inkFaint: '#98A29B',

  // Hairlines and borders.
  line: '#E2DAC8',
  lineStrong: '#CFC5AB',

  // The single accent: soft amber, used sparingly (SOS, highlights, earned states).
  amber: '#C07F24',
  amberBright: '#D9932E',
  amberSoft: '#F4E5C6',

  // Slips are marked in a muted clay, never alarm-red.
  clay: '#A85B41',
  claySoft: '#F0DED4',

  white: '#FFFFFF',
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Archivo_400Regular',
  bodyMedium: 'Archivo_500Medium',
  bodySemiBold: 'Archivo_600SemiBold',
  bodyBold: 'Archivo_700Bold',
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
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};
