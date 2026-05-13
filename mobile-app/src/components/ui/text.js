import React from 'react';
import { Text as RNText } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';
import { useTextClass } from './utils/text-context';

const textVariants = cva('text-base text-slate-950', {
  variants: {
    variant: {
      default: 'text-base text-slate-950',
      title: 'text-3xl font-black text-slate-950',
      subtitle: 'text-base leading-6 text-slate-500',
      label: 'text-sm font-semibold text-slate-700',
      muted: 'text-sm leading-5 text-slate-500',
      error: 'text-sm font-semibold text-red-600',
      code: 'rounded-md bg-slate-100 px-1 font-mono text-sm text-slate-950',
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
