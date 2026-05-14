import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { getThemeColors, theme } from '../../styles/theme';

/**
 * Provides NativeWind runtime theme variables to the whole routed app tree.
 * @param {{ children: React.ReactNode }} props - Provider content.
 * @returns {React.ReactElement} Theme variable wrapper.
 */
export default function AppThemeProvider({ children }) {
  const { colorScheme } = useColorScheme();
  const activeColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = getThemeColors(colorScheme);

  return (
    <View
      className="flex-1 bg-background"
      style={[theme.variables[activeColorScheme], { backgroundColor: colors.background }]}
    >
      {children}
    </View>
  );
}
