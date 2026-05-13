import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import BuildUpChecklistScreen from '../screens/BuildUpChecklistScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8FAFC',
    card: '#FFFFFF',
  },
};

/**
 * Renders app navigation based on authentication state.
 * @returns {React.ReactElement} Navigation container.
 */
export default function AppNavigator() {
  const { bootError, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50" style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator color="#2563EB" />
        <Text className="mt-4 text-sm text-slate-500">Memuat MAU APP...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="BuildUpChecklist" component={BuildUpChecklistScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
      {bootError ? (
        <View className="absolute bottom-4 left-4 right-4 rounded-2xl bg-red-50 p-4">
          <Text className="text-sm font-semibold text-red-700">{bootError}</Text>
        </View>
      ) : null}
    </NavigationContainer>
  );
}
