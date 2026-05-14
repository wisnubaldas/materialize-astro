import React from 'react';
import { Text as RNText } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';
import { useTextClass } from './utils/text-context';

const textVariants = cva('text-base text-foreground', {
  variants: {
    variant: {
      default: 'text-base text-foreground',
      title: 'text-3xl font-black text-foreground',
      subtitle: 'text-base leading-6 text-muted-foreground',
      label: 'text-sm font-semibold text-foreground',
      muted: 'text-sm leading-5 text-muted-foreground',
      error: 'text-sm font-semibold text-destructive',
      code: 'rounded-md bg-muted px-1 font-mono text-sm text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Renders app text with shared NativeWind variants.
 * @param {{ variant?: 'default'|'title'|'subtitle'|'label'|'muted'|'error'|'code', className?: string, children?: React.ReactNode }} props - Text props.
 * @returns {React.ReactElement} Styled text element.
 */
export function Text({ variant = 'default', className = '', ...props }) {
  const inheritedClassName = useTextClass();

  return <RNText className={cn(textVariants({ variant }), inheritedClassName, className)} {...props} />;
}
