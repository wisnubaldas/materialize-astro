import { useColorScheme, vars } from 'nativewind';

const lightColors = {
  background: '#F8FAFC',
  foreground: '#0F172A',
  card: '#FFFFFF',
  cardForeground: '#0F172A',
  primary: '#4F46E5',
  primaryForeground: '#FFFFFF',
  primaryDark: '#4338CA',
  text: '#0F172A',
  mutedBackground: '#F1F5F9',
  muted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  destructiveForeground: '#FFFFFF',
};

const darkColors = {
  background: '#020617',
  foreground: '#F8FAFC',
  card: '#0F172A',
  cardForeground: '#F8FAFC',
  primary: '#818CF8',
  primaryForeground: '#0F172A',
  primaryDark: '#6366F1',
  text: '#F8FAFC',
  mutedBackground: '#1E293B',
  muted: '#CBD5E1',
  border: '#334155',
  danger: '#F87171',
  destructiveForeground: '#FFFFFF',
};

/**
 * Converts runtime color tokens to NativeWind CSS variable values.
 * @param {object} colors - Runtime color token map.
 * @returns {object} NativeWind variable style object.
 */
function createThemeVariables(colors) {
  return vars({
    '--color-background': colors.background,
    '--color-foreground': colors.foreground,
    '--color-card': colors.card,
    '--color-card-foreground': colors.cardForeground,
    '--color-primary': colors.primary,
    '--color-primary-foreground': colors.primaryForeground,
    '--color-muted': colors.mutedBackground,
    '--color-muted-foreground': colors.muted,
    '--color-border': colors.border,
    '--color-destructive': colors.danger,
    '--color-destructive-foreground': colors.destructiveForeground,
  });
}

/**
 * Shared visual tokens for the React Native mobile app.
 */
export const theme = {
  colors: lightColors,
  colorModes: {
    light: lightColors,
    dark: darkColors,
  },
  variables: {
    light: createThemeVariables(lightColors),
    dark: createThemeVariables(darkColors),
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 8,
    lg: 8,
  },
};

/**
 * Returns the active color token set for the current color scheme.
 * @param {string|null|undefined} colorScheme - Active color scheme value.
 * @returns {object} Color token set.
 */
export function getThemeColors(colorScheme) {
  return colorScheme === 'dark' ? darkColors : lightColors;
}

/**
 * Reads active app colors from the current NativeWind color scheme.
 * @returns {object} Active color token set.
 */
export function useThemeColors() {
  const { colorScheme } = useColorScheme();

  return getThemeColors(colorScheme);
}

/**
 * Converts a hex color to an rgba string.
 * @param {string} hex - Hex color value.
 * @param {number} alpha - Alpha channel from 0 to 1.
 * @returns {string} RGBA color.
 */
function hexToRgba(hex, alpha) {
  const normalizedHex = hex.replace('#', '');
  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Resolves common app background utility classes to active theme colors.
 * @param {string} className - NativeWind class names.
 * @param {object} colors - Active color tokens.
 * @param {string} fallback - Fallback background color.
 * @returns {string} Background color.
 */
export function resolveBackgroundColor(className, colors, fallback) {
  if (className.includes('bg-card/70')) return hexToRgba(colors.card, 0.7);
  if (className.includes('bg-white/10')) return 'rgba(255, 255, 255, 0.1)';
  if (className.includes('bg-white/20')) return 'rgba(255, 255, 255, 0.2)';
  if (className.includes('bg-primary')) return colors.primary;
  if (className.includes('bg-primary-foreground')) return colors.primaryForeground;
  if (className.includes('bg-card')) return colors.card;
  if (className.includes('bg-muted')) return colors.mutedBackground;
  if (className.includes('bg-background')) return colors.background;
  if (className.includes('bg-foreground')) return colors.foreground;
  if (className.includes('bg-destructive')) return colors.danger;
  if (className.includes('bg-transparent')) return 'transparent';

  return fallback;
}

/**
 * Resolves common app text utility classes to active theme colors.
 * @param {string} className - NativeWind class names.
 * @param {object} colors - Active color tokens.
 * @param {string} fallback - Fallback text color.
 * @returns {string} Text color.
 */
export function resolveTextColor(className, colors, fallback) {
  if (className.includes('text-primary-foreground')) return colors.primaryForeground;
  if (className.includes('text-muted-foreground')) return colors.muted;
  if (className.includes('text-card-foreground')) return colors.cardForeground;
  if (className.includes('text-destructive-foreground')) return colors.destructiveForeground;
  if (className.includes('text-destructive')) return colors.danger;
  if (className.includes('text-primary')) return colors.primary;
  if (className.includes('text-white/85')) return 'rgba(255, 255, 255, 0.85)';
  if (className.includes('text-white')) return '#FFFFFF';
  if (className.includes('text-indigo-100')) return '#E0E7FF';
  if (className.includes('text-red-700')) return '#B91C1C';
  if (className.includes('text-red-600')) return '#DC2626';
  if (className.includes('text-slate-500')) return colors.muted;
  if (className.includes('text-slate-950')) return colors.foreground;
  if (className.includes('text-background')) return colors.background;
  if (className.includes('text-foreground')) return colors.foreground;

  return fallback;
}
