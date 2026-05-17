import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import ScreenHeader from '../../components/layout/ScreenHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, CardContent, DatePicker, Text } from '../../components/ui';
import { listBuildUpCheckHeaders } from '../../services/buildUpService';
import { useThemeColors } from '../../styles/theme';

/**
 * Renders one compact label and value pair.
 * @param {{ label: string, value: string|number|null|undefined }} props - Display props.
 * @returns {React.ReactElement} Label value row.
 */
function InfoLine({ label, value }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-foreground">
        {value || '-'}
      </Text>
    </View>
  );
}

/**
 * Renders the Draft Build Up screen for searching and selecting one Build Up header.
 * @param {{ onBack?: Function, onOpenMasterAwb?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Draft Build Up screen.
 */
export default function DraftBuildUpScreen({ onBack, onOpenMasterAwb }) {
  const colors = useThemeColors();
  const [flightDate, setFlightDate] = useState('');
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Loads Build Up Check headers using the active flight date filter.
   * @returns {Promise<void>} Resolves after headers are loaded.
   */
  async function loadHeaders() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const rows = await listBuildUpCheckHeaders({ flightDate });
      setHeaders(rows);
    } catch (error) {
      console.error('[draft-build-up] Load headers gagal', error);
      setErrorMessage(error?.message || 'Gagal memuat header Build Up Check.');
    } finally {
      setIsLoading(false);
    }
  }

  useFocusEffect(useCallback(() => {
    loadHeaders();
  }, [flightDate]));

  return (
    <ScreenLayout
      keyboardAware
      header={<ScreenHeader title="Draft Build Up" onBack={onBack} onClose={onBack} />}
    >
      <View className="rounded-sm bg-blue-200/70 px-5 py-4">
        <Text variant="title">Draft Build Up</Text>
        <Text variant="subtitle" className="mt-2">
          Pilih header, lengkapi detail, lalu input rincian sampai total pieces terpenuhi.
        </Text>
      </View>

      <Card className="mt-6 rounded-sm bg-card/70">
        <CardContent className="gap-3 p-4">
          <DatePicker
            label="Cari Flight Date"
            value={flightDate}
            onChange={setFlightDate}
            placeholder="YYYY-MM-DD"
          />
          <Button variant="outline" onPress={loadHeaders}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.foreground} />
            <Text className="ml-2">{isLoading ? 'Memuat...' : 'Cari Header'}</Text>
          </Button>
        </CardContent>
      </Card>

      <View className="mt-5 gap-3">
        {headers.map((header) => (
          <Pressable
            key={header.id}
            onPress={() => {
              if (onOpenMasterAwb) {
                onOpenMasterAwb(header);
              }
            }}
          >
            <Card className="rounded-sm bg-indigo-100 ">
              <CardContent className="gap-2 p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-lg font-extrabold text-foreground">
                    {header.flight_no || '-'}
                  </Text>
                  <Text
                    className={`text-xs font-bold ${header.is_completed ? 'text-lime' : 'text-red-600'}`}
                  >
                    {header.is_completed ? 'SELESAI' : 'BELUM SELESAI'}
                  </Text>
                </View>
                <InfoLine label="Flight Date" value={header.flight_date} />
                <InfoLine label="ULD" value={header.uld} />
                <InfoLine
                  label="Pieces"
                  value={`${header.completed_pieces}/${header.total_pieces}`}
                />
              </CardContent>
            </Card>
          </Pressable>
        ))}
      </View>

      {errorMessage ? (
        <View className="mt-4 rounded-sm border border-destructive bg-red-50 p-4">
          <Text variant="error">{errorMessage}</Text>
        </View>
      ) : null}
    </ScreenLayout>
  );
}
