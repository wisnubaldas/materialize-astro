import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  return (
    <View className="w-full web:max-w-[520px]" style={headerStyles.frame}>
      <View className="min-h-12 flex-row items-center justify-between">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
          >
            <MaterialCommunityIcons name="arrow-left" size={27} color="#0F172A" />
          </Pressable>
        ) : (
          <View className="h-12 w-12" />
        )}

        {title ? <Text className="text-base font-extrabold text-slate-950">{title}</Text> : <View />}

        {right || (
          onClose ? (
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
            >
              <MaterialCommunityIcons name="close" size={27} color="#0F172A" />
            </Pressable>
          ) : (
            <View className="h-12 w-12" />
          )
        )}
      </View>
    </View>
  );
}
