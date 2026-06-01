import React from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Spinner } from '../src/components/ui';
import { useAuth } from '../src/contexts/AuthContext';
import DraftBuildUpMasterAWBScreen from '../src/screens/buildup/DraftBuildUpMasterAWBScreen';
import { useThemeColors } from '../src/styles/theme';

/**
 * Converts route params into the selected Build Up header object.
 * @param {object} params - Expo Router local search params.
 * @returns {object|null} Header object or null when required data is missing.
 */
function getHeaderFromParams(params) {
  const headerId = Number(params.headerId);

  if (!headerId) {
    return null;
  }

  return {
    id: headerId,
    flight_no: params.flightNo || '',
    flight_date: params.flightDate || '',
    uld: params.uld || '',
    dest: params.dest || '',
    completed_pieces: Number(params.completedPieces || 0),
    total_pieces: Number(params.totalPieces || 0),
    is_closed: params.isClosed === 'true',
    closed_at: params.closedAt || '',
  };
}

/**
 * Renders the Master AWB creation route for authenticated users.
 * @returns {React.ReactElement} Master AWB route content.
 */
export default function DraftBuildUpMasterAWBRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useThemeColors();
  const header = getHeaderFromParams(params);

  /**
   * Returns to Draft Build Up through an explicit route replacement.
   * @returns {void}
   */
  function handleBack() {
    router.replace('/draft-build-up');
  }

  /**
   * Opens rincian input for the selected Master AWB detail.
   * @param {object} detail - Selected Master AWB detail.
   * @returns {void}
   */
  function handleOpenRincian(detail) {
    router.push({
      pathname: '/draft-build-up-rincian',
      params: {
        headerId: String(header.id),
        flightNo: header.flight_no || '',
        flightDate: header.flight_date || '',
        uld: header.uld || '',
        dest: header.dest || '',
        headerCompletedPieces: String(header.completed_pieces || 0),
        headerTotalPieces: String(header.total_pieces || 0),
        detailId: String(detail.id),
        mawb: detail.mawb || '',
        agent: detail.agent || '',
        completedPieces: String(detail.completed_pieces || 0),
        totalPieces: String(detail.total_pieces || 0),
        masterTotalPieces: String(detail.master_total_pieces || 0),
        masterCompletedPieces: String(detail.master_completed_pieces || 0),
        masterRemainingPieces: String(detail.master_remaining_pieces || 0),
        remainingPieces: String(detail.remaining_pieces || 0),
        isCompleted: detail.is_completed ? 'true' : 'false',
        isAllocationFinal: detail.is_allocation_final ? 'true' : 'false',
        isSplitUld: detail.is_split_uld ? 'true' : 'false',
        splitSequence: String(detail.split_sequence || ''),
        splitTotalUld: String(detail.split_total_uld || 1),
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

  if (!header) {
    return <Redirect href="/draft-build-up" />;
  }

  return (
    <DraftBuildUpMasterAWBScreen
      header={header}
      onBack={handleBack}
      onOpenRincian={handleOpenRincian}
    />
  );
}
