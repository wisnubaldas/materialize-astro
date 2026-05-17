import { useColorScheme, vars } from 'nativewind';
import { TAILWIND_COLOR_ALIASES, TAILWIND_COLORS, TAILWIND_SIMPLE_COLORS } from './tailwind-colors';

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
  warning: TAILWIND_COLOR_ALIASES.warning,
  lime: TAILWIND_COLOR_ALIASES.lime,
  green: TAILWIND_COLOR_ALIASES.green,
  teal: TAILWIND_COLOR_ALIASES.teal,
  cyan: TAILWIND_COLOR_ALIASES.cyan,
  violet: TAILWIND_COLOR_ALIASES.violet,
  pink: TAILWIND_COLOR_ALIASES.pink,
  gray: TAILWIND_COLOR_ALIASES.gray,
  slate: TAILWIND_COLOR_ALIASES.slate,
  indigo: TAILWIND_COLOR_ALIASES.indigo,
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
  warning: TAILWIND_COLOR_ALIASES.warning,
  lime: TAILWIND_COLOR_ALIASES.lime,
  green: TAILWIND_COLOR_ALIASES.green,
  teal: TAILWIND_COLOR_ALIASES.teal,
  cyan: TAILWIND_COLOR_ALIASES.cyan,
  violet: TAILWIND_COLOR_ALIASES.violet,
  pink: TAILWIND_COLOR_ALIASES.pink,
  gray: TAILWIND_COLOR_ALIASES.gray,
  slate: TAILWIND_COLOR_ALIASES.slate,
  indigo: TAILWIND_COLOR_ALIASES.indigo,
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
    '--color-warning': colors.warning,
    '--color-lime': colors.lime,
    '--color-green': colors.green,
    '--color-teal': colors.teal,
    '--color-cyan': colors.cyan,
    '--color-violet': colors.violet,
    '--color-pink': colors.pink,
    '--color-gray': colors.gray,
    '--color-slate': colors.slate,
    '--color-indigo': colors.indigo,
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
 * Applies a numeric opacity value to a supported color string.
 * @param {string} color - Hex, rgb, rgba, or transparent color.
 * @param {number|undefined} alpha - Alpha channel from 0 to 1.
 * @returns {string} Color with opacity applied when possible.
 */
function applyColorOpacity(color, alpha) {
  if (alpha === undefined) return color;
  if (color === 'transparent') return color;
  if (color.startsWith('#')) return hexToRgba(color, alpha);

  return color;
}

/**
 * Converts Tailwind opacity suffixes such as /20 or /[71.37%] to alpha.
 * @param {string|undefined} opacityToken - Tailwind opacity token.
 * @returns {number|undefined} Alpha channel from 0 to 1.
 */
function parseOpacityToken(opacityToken) {
  if (!opacityToken) return undefined;

  const normalizedToken = opacityToken.replace(/^\[/, '').replace(/\]$/, '');
  const numericValue = Number(normalizedToken.replace('%', ''));

  if (Number.isNaN(numericValue)) return undefined;

  return Math.min(1, Math.max(0, numericValue / 100));
}

/**
 * Checks whether a NativeWind class list contains an exact utility.
 * @param {string} className - NativeWind class names.
 * @param {string} utility - Utility class to find.
 * @returns {boolean} True when the utility exists as its own class.
 */
function hasUtility(className, utility) {
  return className.split(/\s+/).includes(utility);
}

/**
 * Resolves Tailwind color utilities such as bg-lime-500 or text-slate-950.
 * @param {string} className - NativeWind class names.
 * @param {string} prefix - Utility prefix, for example bg- or text-.
 * @returns {string|undefined} Resolved color value.
 */
function resolveTailwindColorUtility(className, prefix) {
  const classes = className.split(/\s+/);

  for (const utilityClass of classes) {
    if (!utilityClass.startsWith(prefix)) continue;

    const utilityValue = utilityClass.slice(prefix.length);
    const [colorToken, opacityToken] = utilityValue.split('/');
    const alpha = parseOpacityToken(opacityToken);

    if (TAILWIND_SIMPLE_COLORS[colorToken]) {
      return applyColorOpacity(TAILWIND_SIMPLE_COLORS[colorToken], alpha);
    }

    if (TAILWIND_COLOR_ALIASES[colorToken]) {
      return applyColorOpacity(TAILWIND_COLOR_ALIASES[colorToken], alpha);
    }

    const shadeSeparatorIndex = colorToken.lastIndexOf('-');
    if (shadeSeparatorIndex === -1) continue;

    const colorName = colorToken.slice(0, shadeSeparatorIndex);
    const colorShade = colorToken.slice(shadeSeparatorIndex + 1);
    const colorValue = TAILWIND_COLORS[colorName]?.[colorShade];

    if (colorValue) {
      return applyColorOpacity(colorValue, alpha);
    }
  }

  return undefined;
}

/**
 * Resolves common app background utility classes to active theme colors.
 * @param {string} className - NativeWind class names.
 * @param {object} colors - Active color tokens.
 * @param {string} fallback - Fallback background color.
 * @returns {string} Background color.
 */
export function resolveBackgroundColor(className, colors, fallback) {
  const tailwindColor = resolveTailwindColorUtility(className, 'bg-');

  if (tailwindColor) return tailwindColor;
  if (hasUtility(className, 'bg-card/70')) return hexToRgba(colors.card, 0.7);
  if (hasUtility(className, 'bg-white/10')) return 'rgba(255, 255, 255, 0.1)';
  if (hasUtility(className, 'bg-white/20')) return 'rgba(255, 255, 255, 0.2)';
  if (hasUtility(className, 'bg-primary-foreground')) return colors.primaryForeground;
  if (hasUtility(className, 'bg-primary')) return colors.primary;
  if (hasUtility(className, 'bg-card')) return colors.card;
  if (hasUtility(className, 'bg-muted')) return colors.mutedBackground;
  if (hasUtility(className, 'bg-background')) return colors.background;
  if (hasUtility(className, 'bg-foreground')) return colors.foreground;
  if (hasUtility(className, 'bg-destructive')) return colors.danger;
  if (hasUtility(className, 'bg-transparent')) return 'transparent';

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
  const tailwindColor = resolveTailwindColorUtility(className, 'text-');

  if (tailwindColor) return tailwindColor;
  if (hasUtility(className, 'text-primary-foreground')) return colors.primaryForeground;
  if (hasUtility(className, 'text-muted-foreground')) return colors.muted;
  if (hasUtility(className, 'text-card-foreground')) return colors.cardForeground;
  if (hasUtility(className, 'text-destructive-foreground')) return colors.destructiveForeground;
  if (hasUtility(className, 'text-destructive')) return colors.danger;
  if (hasUtility(className, 'text-primary')) return colors.primary;
  if (hasUtility(className, 'text-white/85')) return 'rgba(255, 255, 255, 0.85)';
  if (hasUtility(className, 'text-white')) return '#FFFFFF';
  if (hasUtility(className, 'text-indigo-100')) return '#E0E7FF';
  if (hasUtility(className, 'text-red-700')) return '#B91C1C';
  if (hasUtility(className, 'text-red-600')) return '#DC2626';
  if (hasUtility(className, 'text-slate-500')) return colors.muted;
  if (hasUtility(className, 'text-slate-950')) return colors.foreground;
  if (hasUtility(className, 'text-background')) return colors.background;
  if (hasUtility(className, 'text-foreground')) return colors.foreground;

  return fallback;
}

/**
 * Resolves common app border utility classes to active theme colors.
 * @param {string} className - NativeWind class names.
 * @param {object} colors - Active color tokens.
 * @param {string} fallback - Fallback border color.
 * @returns {string} Border color.
 */
export function resolveBorderColor(className, colors, fallback) {
  const tailwindColor = resolveTailwindColorUtility(className, 'border-');

  if (tailwindColor) return tailwindColor;
  if (hasUtility(className, 'border-primary-foreground')) return colors.primaryForeground;
  if (hasUtility(className, 'border-primary')) return colors.primary;
  if (hasUtility(className, 'border-card')) return colors.card;
  if (hasUtility(className, 'border-muted')) return colors.mutedBackground;
  if (hasUtility(className, 'border-background')) return colors.background;
  if (hasUtility(className, 'border-foreground')) return colors.foreground;
  if (hasUtility(className, 'border-destructive')) return colors.danger;
  if (hasUtility(className, 'border-border')) return colors.border;
  if (hasUtility(className, 'border-transparent')) return 'transparent';

  return fallback;
}
