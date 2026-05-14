import React from 'react';
import { View } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';
import { TextClassContext } from './utils/text-context';
import { useThemeColors } from '../../styles/theme';

const badgeVariants = cva('self-start rounded-sm border px-3 py-1', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary',
      secondary: 'border-transparent bg-muted',
      destructive: 'border-transparent bg-destructive',
      outline: 'border-border bg-card',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const badgeTextVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Renders a compact status badge and provides text styling to children.
 * @param {{ variant?: 'default'|'secondary'|'destructive'|'outline', className?: string, textClassName?: string, children?: React.ReactNode }} props - Badge props.
 * @returns {React.ReactElement} Badge container.
 */
export function Badge({ variant = 'default', className = '', textClassName = '', ...props }) {
  const colors = useThemeColors();
  const variantStyles = {
    default: {
      backgroundColor: colors.primary,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: colors.mutedBackground,
      borderColor: 'transparent',
    },
    destructive: {
      backgroundColor: colors.danger,
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
  };
  const themeStyle = variantStyles[variant] || variantStyles.default;
  const callerStyle = props.style;

  return (
    <TextClassContext.Provider value={cn(badgeTextVariants({ variant }), textClassName)}>
      <View className={cn(badgeVariants({ variant }), className)} {...props} style={[themeStyle, callerStyle]} />
    </TextClassContext.Provider>
  );
}
