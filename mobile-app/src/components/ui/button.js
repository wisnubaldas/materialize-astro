import React from 'react';
import { Platform, Pressable } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';
import { TextClassContext } from './utils/text-context';
import { resolveBackgroundColor, useThemeColors } from '../../styles/theme';

const buttonVariants = cva('group flex-row items-center justify-center rounded-sm', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-muted',
      outline: 'border border-border bg-card',
      ghost: 'bg-transparent',
      destructive: 'bg-destructive',
      link: 'bg-transparent px-0',
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

  return {
    ...baseStyle,
    backgroundColor,
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
  };
}

/**
 * Renders a reusable Pressable button with NativeWind variants.
 * @param {{ variant?: 'default'|'secondary'|'outline'|'ghost'|'destructive'|'link', size?: 'default'|'sm'|'lg'|'icon', className?: string, textClassName?: string, disabled?: boolean, android_ripple?: object, style?: object|Function, children?: React.ReactNode }} props - Button props.
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

    return [buttonColorStyle, Platform.OS === 'ios' && state.pressed ? { opacity: 0.75 } : null, callerStyle];
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
