import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import '../global.css';
import AppThemeProvider from '../src/components/layout/AppThemeProvider';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

/**
 * Displays auth boot errors above the routed screen tree.
 * @returns {React.ReactElement|null} Error banner when session boot fails.
 */
function AuthBootErrorBanner() {
  const { bootError } = useAuth();

  if (!bootError) {
    return null;
  }

  return (
    <View className="absolute bottom-4 left-4 right-4 rounded-sm bg-red-50 p-4">
      <Text className="text-sm font-semibold text-red-700">{bootError}</Text>
    </View>
  );
}

/**
 * Root Expo Router layout for MAU APP Mobile.
 * @returns {React.ReactElement} Provider and route stack tree.
 */
export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <StatusBar style={statusBarStyle} />
          <Stack screenOptions={{ headerShown: false }} />
          <AuthBootErrorBanner />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
