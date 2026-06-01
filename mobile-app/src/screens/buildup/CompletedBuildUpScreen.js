import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import ScreenHeader from '../../components/layout/ScreenHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, CardContent, DatePicker, Text } from '../../components/ui';
import {
  listCompletedBuildUpCheckHeaders,
  openBuildUpCheckHeader,
} from '../../services/buildUpService';
import { useThemeColors } from '../../styles/theme';

/**
 * Formats current local date into backend-friendly `YYYY-MM-DD`.
 * @returns {string} Current date string.
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Renders manually closed Build Up headers and allows opening them again.
 * @param {{ onBack?: Function, onReopened?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Closed Build Up screen.
 */
export default function CompletedBuildUpScreen({ onBack, onReopened }) {
  const colors = useThemeColors();
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flightDate, setFlightDate] = useState(getTodayDate);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');

  /**
   * Loads completed Build Up headers from backend.
   * @param {string} selectedFlightDate - Flight date filter.
   * @returns {Promise<void>} Resolves after load finishes.
   */
  async function loadCompletedHeaders(selectedFlightDate = flightDate) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const rows = await listCompletedBuildUpCheckHeaders({
        flightDate: selectedFlightDate,
      });
      setHeaders(rows);
    } catch (error) {
      console.error('[completed-build-up] Load completed headers gagal', error);
      setErrorMessage(error?.message || 'Gagal memuat Build Up selesai.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCompletedHeaders(flightDate);
  }, [flightDate]);

  /**
   * Opens a manually closed ULD header and routes user back to draft flow.
   * @param {object} header - Closed Build Up header row.
   * @returns {Promise<void>} Resolves after the ULD is opened.
   */
  async function handleOpenHeader(header) {
    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      await openBuildUpCheckHeader(header.id);
      setMessage('Build Up ULD berhasil dibuka.');
      await loadCompletedHeaders(flightDate);
      if (onReopened) {
        onReopened();
      }
    } catch (error) {
      console.error('[completed-build-up] Open header gagal', error);
      setErrorMessage(error?.message || 'Gagal membuka Build Up ULD.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout header={<ScreenHeader title="Build Up Ditutup" onBack={onBack} onClose={onBack} />}>
      <>
          <View className="rounded-sm bg-blue-200/70 px-5 py-4">
            <Text variant="title">Build Up Ditutup</Text>
            <Text variant="subtitle" className="mt-2">
              Daftar nomor ULD yang sudah ditutup manual dan bisa dibuka kembali bila perlu.
            </Text>
          </View>

          <Card className="mt-5 rounded-sm bg-card">
            <CardContent className="gap-4 p-4">
              <DatePicker
                label="Cari Flight Date"
                value={flightDate}
                onChange={setFlightDate}
              />
              <Button variant="outline" onPress={() => loadCompletedHeaders(flightDate)}>
                <MaterialCommunityIcons name="refresh" size={20} color={colors.foreground} />
                <Text className="ml-2">{isLoading ? 'Memuat...' : 'Cari Header'}</Text>
              </Button>
            </CardContent>
          </Card>

          <View className="mt-5 gap-3">
            {headers.map((header) => (
              <Pressable key={header.id} onPress={() => handleOpenHeader(header)}>
                <Card className="rounded-sm bg-card">
                  <CardContent className="gap-3 p-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="flex-1 text-lg font-extrabold text-foreground">
                        {header.uld || '-'}
                      </Text>
                      <Text className="text-xs font-bold text-lime">DITUTUP</Text>
                    </View>
                    <View className="flex-row justify-between gap-3">
                      <Text className="text-sm text-muted-foreground">Flight Date</Text>
                      <Text className="flex-1 text-right text-sm font-semibold text-foreground">
                        {header.flight_date || '-'}
                      </Text>
                    </View>
                    <View className="flex-row justify-between gap-3">
                      <Text className="text-sm text-muted-foreground">Flight No</Text>
                      <Text className="flex-1 text-right text-sm font-semibold text-foreground">
                        {header.flight_no || '-'}
                      </Text>
                    </View>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isSubmitting}
                      onPress={() => handleOpenHeader(header)}
                    >
                      <MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.foreground} />
                      <Text className="ml-2">{isSubmitting ? 'Membuka...' : 'Buka ULD'}</Text>
                    </Button>
                  </CardContent>
                </Card>
              </Pressable>
            ))}
          </View>

          {!isLoading && headers.length === 0 ? (
            <View className="mt-5 rounded-sm border border-border bg-muted p-4">
              <Text className="text-sm text-muted-foreground">
                Belum ada Build Up ditutup pada tanggal {flightDate}.
              </Text>
            </View>
          ) : null}
      </>

      {message ? (
        <View className="mt-4 rounded-sm border border-lime bg-lime/10 p-4">
          <Text className="text-sm font-semibold text-lime">{message}</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View className="mt-4 rounded-sm border border-destructive bg-red-50 p-4">
          <Text variant="error">{errorMessage}</Text>
        </View>
      ) : null}
    </ScreenLayout>
  );
}
