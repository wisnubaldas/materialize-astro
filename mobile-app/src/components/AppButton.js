import React from 'react';
import { ActivityIndicator } from 'react-native';

import { cn } from './ui/utils/cn';
import { Button } from './ui/button';
import { Text } from './ui/text';

/**
 * Reusable rounded button styled with NativeWind utilities.
 * @param {{ title: string, onPress?: Function, disabled?: boolean, loading?: boolean, variant?: 'light'|'dark'|'primary', className?: string }} props - Button props.
 * @returns {React.ReactElement} Pressable button.
 */
export default function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  className = '',
}) {
  const isDisabled = disabled || loading;
  const buttonVariant = variant === 'light' ? 'outline' : 'default';
  const variantClassName = variant === 'dark' ? 'bg-slate-900' : '';
  const textClassName = variant === 'light' ? 'text-slate-950' : 'text-white';

  return (
    <Button
      variant={buttonVariant}
      size="lg"
      disabled={isDisabled}
      onPress={onPress}
      className={cn(variantClassName, className)}
      textClassName={textClassName}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'light' ? '#111111' : '#FFFFFF'} />
      ) : (
        <Text>{title}</Text>
      )}
    </Button>
  );
}
