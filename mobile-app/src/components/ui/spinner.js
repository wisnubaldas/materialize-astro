import React from 'react';
import { ActivityIndicator } from 'react-native';

/**
 * Renders a reusable loading indicator.
 * @param {{ size?: 'small'|'large'|number, color?: string }} props - Spinner props.
 * @returns {React.ReactElement} Activity indicator.
 */
export function Spinner({ size = 'small', color = '#2563EB', ...props }) {
  return <ActivityIndicator size={size} color={color} {...props} />;
}
