import { cva } from 'class-variance-authority';
import React from 'react';
import { Platform, Pressable } from 'react-native';

import { resolveBackgroundColor, resolveBorderColor, useThemeColors } from '../../styles/theme';
import { cn } from './utils/cn';
import { TextClassContext } from './utils/text-context';

const tailwindButtonVariants = {
  slate: 'bg-slate-500',
  gray: 'bg-gray-500',
  zinc: 'bg-zinc-500',
  neutral: 'bg-neutral-500',
  stone: 'bg-stone-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-400',
  yellow: 'bg-yellow-400',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
};

const buttonVariants = cva('group flex-row items-center justify-center rounded-sm', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-muted',
      outline: 'border border-border bg-card',
      ghost: 'bg-transparent',
      destructive: 'bg-destructive',
      link: 'bg-transparent px-0',
      ...tailwindButtonVariants,
    },
    size: {
      default: 'min-h-12 px-5 py-3',
      sm: 'min-h-10 px-4 py-2',
      lg: 'min-h-14 px-6 py-3',
      icon: 'h-12 w-12 px-0 py-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const buttonTextVariants = cva('text-base font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
      link: 'text-primary underline',
      slate: 'text-white',
      gray: 'text-white',
      zinc: 'text-white',
      neutral: 'text-white',
      stone: 'text-white',
      red: 'text-white',
      orange: 'text-white',
      amber: 'text-slate-950',
      yellow: 'text-slate-950',
      lime: 'text-slate-950',
      green: 'text-white',
      emerald: 'text-white',
      teal: 'text-white',
      cyan: 'text-white',
      sky: 'text-white',
      blue: 'text-white',
      indigo: 'text-white',
      violet: 'text-white',
      purple: 'text-white',
      fuchsia: 'text-white',
      pink: 'text-white',
      rose: 'text-white',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-base',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

/**
 * Returns runtime color styles for a button variant.
 * @param {string} variant - Button visual variant.
 * @param {string} className - Caller class names.
 * @param {object} colors - Active theme colors.
 * @returns {object} Pressable style.
 */
function getButtonColorStyle(variant, className, colors) {
  const variantStyles = {
    default: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.mutedBackground,
      borderColor: colors.mutedBackground,
    },
    outline: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    destructive: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    link: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };
  const baseStyle = variantStyles[variant] || variantStyles.default;
  const backgroundColor = resolveBackgroundColor(className, colors, baseStyle.backgroundColor);
  const borderColor = resolveBorderColor(className, colors, baseStyle.borderColor);

  return {
    ...baseStyle,
    backgroundColor,
    borderColor,
  };
}

/**
 * Returns Android ripple colors for the active theme.
 * @param {object} colors - Active theme colors.
 * @returns {object} Ripple color map.
 */
function getRippleColors(colors) {
  return {
    default: colors.primary,
    secondary: colors.foreground,
    outline: colors.foreground,
    ghost: colors.foreground,
    destructive: colors.danger,
    link: colors.primary,
    slate: '#62748E',
    gray: '#6A7282',
    zinc: '#71717B',
    neutral: '#737373',
    stone: '#79716B',
    red: '#FB2C36',
    orange: '#FF6900',
    amber: '#FFB900',
    yellow: '#FDC700',
    lime: '#7CCF00',
    green: '#00C950',
    emerald: '#00BC7D',
    teal: '#00BBA7',
    cyan: '#00B8DB',
    sky: '#00A6F4',
    blue: '#2B7FFF',
    indigo: '#615FFF',
    violet: '#8E51FF',
    purple: '#AD46FF',
    fuchsia: '#E12AFB',
    pink: '#F6339A',
    rose: '#FF2056',
  };
}

/**
 * Renders a reusable Pressable button with NativeWind variants.
 * @param {{ variant?: 'default'|'secondary'|'outline'|'ghost'|'destructive'|'link'|'slate'|'gray'|'zinc'|'neutral'|'stone'|'red'|'orange'|'amber'|'yellow'|'lime'|'green'|'emerald'|'teal'|'cyan'|'sky'|'blue'|'indigo'|'violet'|'purple'|'fuchsia'|'pink'|'rose', size?: 'default'|'sm'|'lg'|'icon', className?: string, textClassName?: string, disabled?: boolean, android_ripple?: object, style?: object|Function, children?: React.ReactNode }} props - Button props.
 * @returns {React.ReactElement} Pressable button.
 */
export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  textClassName = '',
  disabled = false,
  android_ripple,
  style,
  ...props
}) {
  const colors = useThemeColors();
  const buttonColorStyle = getButtonColorStyle(variant, className, colors);
  const rippleColorMap = getRippleColors(colors);
  const ripple = android_ripple || {
    color: rippleColorMap[variant],
    borderless: size === 'icon',
  };

  /**
   * Combines iOS pressed feedback with caller-provided styles.
   * @param {{ pressed: boolean }} state - Pressable interaction state.
   * @returns {Array} Pressable style array.
   */
  function resolveStyle(state) {
    const callerStyle = typeof style === 'function' ? style(state) : style;

    return [
      buttonColorStyle,
      Platform.OS === 'ios' && state.pressed ? { opacity: 0.75 } : null,
      callerStyle,
    ];
  }

  return (
    <TextClassContext.Provider value={cn(buttonTextVariants({ variant, size }), textClassName)}>
      <Pressable
        accessibilityRole="button"
        android_ripple={ripple}
        disabled={disabled}
        style={resolveStyle}
        className={cn(buttonVariants({ variant, size }), disabled && 'opacity-60', className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}
