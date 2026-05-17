import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Spinner } from '../src/components/ui';
import DashboardScreen from '../src/screens/DashboardScreen';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemeColors } from '../src/styles/theme';

/**
 * Renders the authenticated dashboard route or redirects to login.
 * @returns {React.ReactElement} Dashboard route content.
 */
export default function IndexRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useThemeColors();

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

  return (
    <DashboardScreen
      onOpenBuildUpChecklist={() => router.push('/build-up-checklist')}
      onOpenDraftBuildUp={() => router.push('/draft-build-up')}
    />
  );
}
