import React from 'react';
import { View } from 'react-native';

import { Input } from './ui/input';
import { Text } from './ui/text';

/**
 * Reusable labeled text input styled with NativeWind utilities.
 * @param {{ label: string, value: string, onChangeText: Function, secureTextEntry?: boolean, keyboardType?: string, autoCapitalize?: string, placeholder?: string, inputClassName?: string }} props - Input props.
 * @returns {React.ReactElement} Input field.
 */
export default function AppInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  placeholder = '',
  inputClassName = '',
}) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <Input
        className={inputClassName}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
      />
    </View>
  );
}
