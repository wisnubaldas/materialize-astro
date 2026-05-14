import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { getThemeColors } from '../../styles/theme';

const headerStyles = {
  frame: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
};

/**
 * Renders a consistent top bar for stack screens.
 * @param {{ title?: string, onBack?: Function, onClose?: Function, right?: React.ReactNode }} props - Header actions and title.
 * @returns {React.ReactElement} Screen header.
 */
export default function ScreenHeader({ title = '', onBack, onClose, right = null }) {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme);

  return (
    <View className="w-full web:max-w-[520px]" style={headerStyles.frame}>
      <View className="min-h-12 flex-row items-center justify-between">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            className="h-12 w-12 items-center justify-center rounded-sm bg-card"
            style={{ backgroundColor: colors.card }}
          >
            <MaterialCommunityIcons name="arrow-left" size={27} color={colors.foreground} />
          </Pressable>
        ) : (
          <View className="h-12 w-12" />
        )}

        {title ? (
          <Text className="text-base font-extrabold text-foreground" style={{ color: colors.foreground }}>
            {title}
          </Text>
        ) : (
          <View />
        )}

        {right || (
          onClose ? (
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="h-12 w-12 items-center justify-center rounded-sm bg-card"
              style={{ backgroundColor: colors.card }}
            >
              <MaterialCommunityIcons name="close" size={27} color={colors.foreground} />
            </Pressable>
          ) : (
            <View className="h-12 w-12" />
          )
        )}
      </View>
    </View>
  );
}
