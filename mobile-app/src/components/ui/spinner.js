import React from 'react';
import { ActivityIndicator } from 'react-native';

import { useThemeColors } from '../../styles/theme';

/**
 * Renders a reusable loading indicator.
 * @param {{ size?: 'small'|'large'|number, color?: string }} props - Spinner props.
 * @returns {React.ReactElement} Activity indicator.
 */
export function Spinner({ size = 'small', color, ...props }) {
  const colors = useThemeColors();

  return <ActivityIndicator size={size} color={color || colors.primary} {...props} />;
}
