import React from 'react';
import { Platform, TextInput } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';
import { resolveBackgroundColor, resolveBorderColor, resolveTextColor, useThemeColors } from '../../styles/theme';

const inputVariants = cva('min-h-[54px] rounded-sm border bg-card px-4 text-base text-foreground', {
  variants: {
    variant: {
      default: 'border-border',
      error: 'border-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const androidInputStyle = {
  textAlignVertical: 'center',
};

/**
 * Renders a reusable TextInput with stable placeholder color and variants.
 * @param {{ variant?: 'default'|'error', className?: string, placeholderTextColor?: string, style?: object|Array }} props - Text input props.
 * @returns {React.ReactElement} Styled text input.
 */
export function Input({
  variant = 'default',
  className = '',
  placeholderTextColor,
  style,
  ...props
}) {
  const colors = useThemeColors();
  const mergedClassName = cn(inputVariants({ variant }), className);
  const fallbackBorderColor = variant === 'error' ? colors.danger : colors.border;
  const themeStyle = {
    backgroundColor: resolveBackgroundColor(mergedClassName, colors, colors.card),
    borderColor: resolveBorderColor(mergedClassName, colors, fallbackBorderColor),
    color: resolveTextColor(mergedClassName, colors, colors.foreground),
  };

  return (
    <TextInput
      className={mergedClassName}
      placeholderTextColor={placeholderTextColor || colors.muted}
      underlineColorAndroid="transparent"
      style={[themeStyle, Platform.OS === 'android' ? androidInputStyle : null, style]}
      {...props}
    />
  );
}
