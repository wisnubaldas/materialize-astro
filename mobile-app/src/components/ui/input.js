import React from 'react';
import { Platform, TextInput } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';

const inputVariants = cva('min-h-[54px] rounded-2xl border bg-card px-4 text-base text-foreground', {
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
  placeholderTextColor = '#94A3B8',
  style,
  ...props
}) {
  return (
    <TextInput
      className={cn(inputVariants({ variant }), className)}
      placeholderTextColor={placeholderTextColor}
      underlineColorAndroid="transparent"
      style={[Platform.OS === 'android' ? androidInputStyle : null, style]}
      {...props}
    />
  );
}
