import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Spinner } from '../src/components/ui';
import { useAuth } from '../src/contexts/AuthContext';
import DraftBuildUpScreen from '../src/screens/buildup/DraftBuildUpScreen';
import { useThemeColors } from '../src/styles/theme';

/**
 * Renders the Draft Build Up route for authenticated users.
 * @returns {React.ReactElement} Draft Build Up route content.
 */
export default function DraftBuildUpRoute() {
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

  /**
   * Opens the dedicated Master AWB creation screen for the selected Build Up header.
   * @param {object} header - Selected Build Up header.
   * @returns {void}
   */
  function handleOpenMasterAwb(header) {
    router.push({
      pathname: '/draft-build-up-master-awb',
      params: {
        headerId: String(header.id),
        flightNo: header.flight_no || '',
        flightDate: header.flight_date || '',
        uld: header.uld || '',
        dest: header.dest || '',
        completedPieces: String(header.completed_pieces || 0),
        totalPieces: String(header.total_pieces || 0),
      },
    });
  }

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <Spinner />
        <Text className="mt-4 text-sm text-muted-foreground">Memuat MAU APP...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <DraftBuildUpScreen onBack={handleBack} onOpenMasterAwb={handleOpenMasterAwb} />;
}
