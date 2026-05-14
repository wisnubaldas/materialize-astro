import React from 'react';
import { Text as RNText } from 'react-native';
import { cva } from 'class-variance-authority';

import { cn } from './utils/cn';
import { useTextClass } from './utils/text-context';
import { resolveBackgroundColor, resolveTextColor, useThemeColors } from '../../styles/theme';

const textVariants = cva('text-base text-foreground', {
  variants: {
    variant: {
      default: 'text-base text-foreground',
      title: 'text-3xl font-black text-foreground',
      subtitle: 'text-base leading-6 text-muted-foreground',
      label: 'text-sm font-semibold text-foreground',
      muted: 'text-sm leading-5 text-muted-foreground',
      error: 'text-sm font-semibold text-destructive',
      code: 'rounded-sm bg-muted px-1 font-mono text-sm text-foreground',
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
  const colors = useThemeColors();
  const mergedClassName = cn(textVariants({ variant }), inheritedClassName, className);
  const color = resolveTextColor(mergedClassName, colors, colors.foreground);
  const backgroundColor = mergedClassName.includes('bg-')
    ? resolveBackgroundColor(mergedClassName, colors, 'transparent')
    : undefined;
  const themeStyle = backgroundColor ? { color, backgroundColor } : { color };
  const callerStyle = props.style;

  return <RNText className={mergedClassName} {...props} style={[themeStyle, callerStyle]} />;
}
