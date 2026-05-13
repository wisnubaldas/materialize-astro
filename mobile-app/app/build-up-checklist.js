import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Spinner } from '../src/components/ui';
import BuildUpChecklistScreen from '../src/screens/BuildUpChecklistScreen';
import { useAuth } from '../src/contexts/AuthContext';

/**
 * Renders the Build Up Checklist route for authenticated users.
 * @returns {React.ReactElement} Build Up Checklist route content.
 */
export default function BuildUpChecklistRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

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
      <View className="flex-1 items-center justify-center bg-slate-50" style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <Spinner />
        <Text className="mt-4 text-sm text-slate-500">Memuat MAU APP...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <BuildUpChecklistScreen onBack={handleBack} />;
}
