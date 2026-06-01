import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Spinner } from '../src/components/ui';
import BuildUpChecklistScreen from '../src/screens/buildup/BuildUpChecklistScreen';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/styles/theme';

/**
 * Renders the Build Up Checklist route for authenticated users.
 * @returns {React.ReactElement} Build Up Checklist route content.
 */
export default function BuildUpChecklistRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useThemeColors();

  /**
   * Returns to the previous screen or dashboard when no stack history exists.
   * @returns {void}
   */
  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background" style={{ flex: 1, backgroundColor: colors.background }}>
        <Spinner />
        <Text className="mt-4 text-sm text-muted-foreground">Memuat MAU APP...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <BuildUpChecklistScreen onBack={handleBack} />;
}
