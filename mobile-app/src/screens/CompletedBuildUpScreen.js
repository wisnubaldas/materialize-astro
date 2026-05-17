import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import ScreenHeader from '../components/layout/ScreenHeader';
import ScreenLayout from '../components/layout/ScreenLayout';
import { Button, Card, CardContent, Text } from '../components/ui';
import {
  listCompletedBuildUpCheckHeaders,
  reopenBuildUpCheckHeader,
} from '../services/buildUpService';
import { useThemeColors } from '../styles/theme';

/**
 * Renders completed Build Up headers and allows reopening them for new masters.
 * @param {{ onBack?: Function, onReopened?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Completed Build Up screen.
 */
export default function CompletedBuildUpScreen({ onBack, onReopened }) {
  const colors = useThemeColors();
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');

  /**
   * Loads completed Build Up headers from backend.
   * @returns {Promise<void>} Resolves after load finishes.
   */
  async function loadCompletedHeaders() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const rows = await listCompletedBuildUpCheckHeaders();
      setHeaders(rows);
    } catch (error) {
      console.error('[completed-build-up] Load completed headers gagal', error);
      setErrorMessage(error?.message || 'Gagal memuat Build Up selesai.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCompletedHeaders();
  }, []);

  /**
   * Reopens one completed header and routes user back to draft flow.
   * @param {object} header - Completed header row.
   * @returns {Promise<void>} Resolves after reopen finishes.
   */
  async function handleReopen(header) {
    setErrorMessage('');
    setMessage('');

    try {
      await reopenBuildUpCheckHeader(header.id);
      setMessage('Build Up berhasil dibuka kembali.');
      await loadCompletedHeaders();
      if (onReopened) {
        onReopened();
      }
    } catch (error) {
      console.error('[completed-build-up] Reopen header gagal', error);
      setErrorMessage(error?.message || 'Gagal membuka kembali Build Up.');
    }
  }

  return (
    <ScreenLayout
      header={<ScreenHeader title="Build Up Selesai" onBack={onBack} onClose={onBack} />}
    >
      <View className="rounded-sm bg-blue-200/70 px-5 py-4">
        <Text variant="title">Build Up Selesai</Text>
        <Text variant="subtitle" className="mt-2">
          Buka kembali build up selesai untuk menambahkan master AWB/MAWB baru.
        </Text>
      </View>

      <Button variant="outline" className="mt-5" onPress={loadCompletedHeaders}>
        <MaterialCommunityIcons name="refresh" size={20} color={colors.foreground} />
        <Text className="ml-2">{isLoading ? 'Memuat...' : 'Refresh'}</Text>
      </Button>

      <View className="mt-5 gap-3">
        {headers.map((header) => (
          <Pressable key={header.id} onPress={() => handleReopen(header)}>
            <Card className="rounded-sm bg-card">
              <CardContent className="gap-3 p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-lg font-extrabold text-foreground">
                    {header.uld || '-'}
                  </Text>
                  <Text className="text-xs font-bold text-lime">SELESAI</Text>
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
                <Button variant="secondary" size="sm" onPress={() => handleReopen(header)}>
                  <MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.foreground} />
                  <Text className="ml-2">Buka Lagi</Text>
                </Button>
              </CardContent>
            </Card>
          </Pressable>
        ))}
      </View>

      {!isLoading && headers.length === 0 ? (
        <View className="mt-5 rounded-sm border border-border bg-muted p-4">
          <Text className="text-sm text-muted-foreground">Belum ada Build Up selesai.</Text>
        </View>
      ) : null}

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
