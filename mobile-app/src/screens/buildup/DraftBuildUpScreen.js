import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import ScreenHeader from '../../components/layout/ScreenHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Card, CardContent, DatePicker, Text } from '../../components/ui';
import { PatternedCard } from '../../components/ui/patterned-card.js';
import { listBuildUpCheckHeaders } from '../../services/buildUpService';
import { useThemeColors } from '../../styles/theme';

/**
 * Formats current local date into backend-friendly `YYYY-MM-DD`.
 * @returns {string} Current local date string.
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

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
  const [flightDate, setFlightDate] = useState(getTodayDate);
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
      const rows = await listBuildUpCheckHeaders({ flightDate, unfinishedOnly: false });
      setHeaders(rows);
    } catch (error) {
      console.error('[draft-build-up] Load headers gagal', error);
      setErrorMessage(error?.message || 'Gagal memuat header Build Up Check.');
    } finally {
      setIsLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadHeaders();
    }, [flightDate])
  );

  return (
    <ScreenLayout
      keyboardAware
      header={<ScreenHeader title="Draft Build Up" onBack={onBack} onClose={onBack} />}
    >
      <PatternedCard variant="blue">
        <View>
          <Text variant="title" className="text-amber-50">
            Draft Build Up
          </Text>
          <Text variant="subtitle" className="mt-2 text-stone-50">
            Pilih nomor ULD, lengkapi detail, lalu buka atau tutup Build Up secara manual.
          </Text>
        </View>
      </PatternedCard>

      <Card className="mt-6 rounded-sm bg-card/70">
        <CardContent className="gap-3 p-4">
          <DatePicker
            label="Cari Flight Date"
            value={flightDate}
            onChange={setFlightDate}
            placeholder="YYYY-MM-DD"
          />
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
                    className={`text-xs font-bold ${header.is_closed ? 'text-lime' : 'text-red-600'}`}
                  >
                    {header.is_closed ? 'DITUTUP' : 'TERBUKA'}
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
