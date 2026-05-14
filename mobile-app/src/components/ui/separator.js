import React from 'react';
import { View } from 'react-native';

import { cn } from './utils/cn';
import { useThemeColors } from '../../styles/theme';

/**
 * Renders a thin visual separator.
 * @param {{ orientation?: 'horizontal'|'vertical', className?: string }} props - Separator props.
 * @returns {React.ReactElement} Separator view.
 */
export function Separator({ orientation = 'horizontal', className = '' }) {
  const colors = useThemeColors();
  const orientationClassName = orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full';

  return <View className={cn('bg-border', orientationClassName, className)} style={{ backgroundColor: colors.border }} />;
}
