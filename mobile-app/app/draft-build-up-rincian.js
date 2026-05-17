import React from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Spinner } from '../src/components/ui';
import { useAuth } from '../src/contexts/AuthContext';
import DraftBuildUpRincianScreen from '../src/screens/buildup/DraftBuildUpRincianScreen';
import { useThemeColors } from '../src/styles/theme';

/**
 * Converts route params into selected Build Up header and Master AWB objects.
 * @param {object} params - Expo Router local search params.
 * @returns {{ header: object, detail: object }|null} Parsed route context.
 */
function getRincianContextFromParams(params) {
  const headerId = Number(params.headerId);
  const detailId = Number(params.detailId);

  if (!headerId || !detailId) {
    return null;
  }

  return {
    header: {
      id: headerId,
      flight_no: params.flightNo || '',
      flight_date: params.flightDate || '',
      uld: params.uld || '',
      dest: params.dest || '',
      completed_pieces: Number(params.headerCompletedPieces || 0),
      total_pieces: Number(params.headerTotalPieces || 0),
    },
    detail: {
      id: detailId,
      mawb: params.mawb || '',
      agent: params.agent || '',
      completed_pieces: Number(params.completedPieces || 0),
      total_pieces: Number(params.totalPieces || 0),
      remaining_pieces: Number(params.remainingPieces || 0),
      is_completed: params.isCompleted === 'true',
    },
  };
}

/**
 * Renders the Build Up rincian input route for authenticated users.
 * @returns {React.ReactElement} Build Up rincian route content.
 */
export default function DraftBuildUpRincianRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useThemeColors();
  const context = getRincianContextFromParams(params);

  /**
   * Returns to the selected Master MAWB list screen.
   * @returns {void}
   */
  function handleBack() {
    if (!context?.header) {
      router.replace('/draft-build-up');
      return;
    }

    router.replace({
      pathname: '/draft-build-up-master-awb',
      params: {
        headerId: String(context.header.id),
        flightNo: context.header.flight_no || '',
        flightDate: context.header.flight_date || '',
        uld: context.header.uld || '',
        dest: context.header.dest || '',
        completedPieces: String(context.header.completed_pieces || 0),
        totalPieces: String(context.header.total_pieces || 0),
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

  if (!context) {
    return <Redirect href="/draft-build-up" />;
  }

  return (
    <DraftBuildUpRincianScreen
      header={context.header}
      detail={context.detail}
      onBack={handleBack}
    />
  );
}
