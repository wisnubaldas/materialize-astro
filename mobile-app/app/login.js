import React from 'react';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { Spinner } from '../src/components/ui';
import { useAuth } from '../src/contexts/AuthContext';
import LoginScreen from '../src/screens/LoginScreen';

/**
 * Renders the login route for unauthenticated users.
 * @returns {React.ReactElement} Login route content.
 */
export default function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50" style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <Spinner />
        <Text className="mt-4 text-sm text-slate-500">Memuat MAU APP...</Text>
      </View>
    );
  }

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/" />;
  }

  return <LoginScreen />;
}
