import React from 'react';
import { View } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';
import { TextClassContext } from './utils/text-context';

const badgeVariants = cva('self-start rounded-full border px-3 py-1', {
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
  return (
    <TextClassContext.Provider value={cn(badgeTextVariants({ variant }), textClassName)}>
      <View className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}
