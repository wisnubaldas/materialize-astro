import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import ScreenHeader from '../../components/layout/ScreenHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, CardContent, DatePicker, Input, Text } from '../../components/ui';
import {
  listCompletedBuildUpCheckHeaders,
  reopenBuildUpCheckHeader,
} from '../../services/buildUpService';
import { useThemeColors } from '../../styles/theme';

const initialReopenForm = {
  mawb: '',
  total_pieces: '',
  agent: '',
  remark: '',
};

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
 * Renders completed Build Up headers and allows reopening them for new masters.
 * @param {{ onBack?: Function, onReopened?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Completed Build Up screen.
 */
export default function CompletedBuildUpScreen({ onBack, onReopened }) {
  const colors = useThemeColors();
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [reopenForm, setReopenForm] = useState(initialReopenForm);
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
   * Selects one completed header and opens the required MAWB form.
   * @param {object} header - Completed header row.
   * @returns {void}
   */
  function handleSelectHeader(header) {
    setSelectedHeader(header);
    setReopenForm(initialReopenForm);
    setErrorMessage('');
    setMessage('');
  }

  /**
   * Cancels MAWB reopen form and returns to completed header list.
   * @returns {void}
   */
  function handleCancelReopen() {
    setSelectedHeader(null);
    setReopenForm(initialReopenForm);
    setErrorMessage('');
    setMessage('');
  }

  /**
   * Updates one reopen form field.
   * @param {string} field - Field name.
   * @param {string} value - Field value.
   * @returns {void}
   */
  function handleFormChange(field, value) {
    setReopenForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /**
   * Reopens selected completed header and routes user back to draft flow.
   * @returns {Promise<void>} Resolves after reopen finishes.
   */
  async function handleReopen() {
    if (!selectedHeader) {
      setErrorMessage('Pilih Build Up selesai terlebih dahulu.');
      return;
    }

    const mawb = reopenForm.mawb.trim();
    const totalPieces = Number.parseInt(reopenForm.total_pieces, 10);
    if (!mawb) {
      setErrorMessage('Nomor Master AWB wajib diisi.');
      return;
    }
    if (!Number.isFinite(totalPieces) || totalPieces <= 0) {
      setErrorMessage('Pieces wajib diisi lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      await reopenBuildUpCheckHeader(selectedHeader.id, {
        mawb,
        total_pieces: totalPieces,
        agent: reopenForm.agent.trim() || null,
        remark: reopenForm.remark.trim() || null,
      });
      setMessage('Build Up berhasil dibuka kembali.');
      setSelectedHeader(null);
      setReopenForm(initialReopenForm);
      await loadCompletedHeaders(flightDate);
      if (onReopened) {
        onReopened();
      }
    } catch (error) {
      console.error('[completed-build-up] Reopen header gagal', error);
      setErrorMessage(error?.message || 'Gagal membuka kembali Build Up.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout
      header={<ScreenHeader title="Build Up Selesai" onBack={onBack} onClose={onBack} />}
    >
      {selectedHeader ? (
        <Card className="mt-5 rounded-sm bg-card">
          <CardContent className="gap-4 p-4">
            <View>
              <Text className="text-lg font-extrabold text-foreground">Master AWB Baru</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                {selectedHeader.uld || '-'} / {selectedHeader.flight_date || '-'}
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Nomor Master AWB</Text>
              <Input
                placeholder="123-12345678"
                value={reopenForm.mawb}
                onChangeText={(value) => handleFormChange('mawb', value)}
                autoCapitalize="characters"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Pieces</Text>
              <Input
                placeholder="0"
                value={reopenForm.total_pieces}
                onChangeText={(value) => handleFormChange('total_pieces', value)}
                keyboardType="numeric"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Agent</Text>
              <Input
                placeholder="Nama agent"
                value={reopenForm.agent}
                onChangeText={(value) => handleFormChange('agent', value)}
                autoCapitalize="characters"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Remark</Text>
              <Input
                className="min-h-24"
                placeholder="Catatan"
                value={reopenForm.remark}
                onChangeText={(value) => handleFormChange('remark', value)}
                multiline
              />
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={handleCancelReopen}
              >
                <Text>Batal</Text>
              </Button>
              <Button className="flex-1" onPress={handleReopen} disabled={isSubmitting}>
                <MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.primaryForeground} />
                <Text className="ml-2 text-primary-foreground">
                  {isSubmitting ? 'Membuka...' : 'Buka Lagi'}
                </Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      ) : (
        <>
          <View className="rounded-sm bg-blue-200/70 px-5 py-4">
            <Text variant="title">Build Up Selesai</Text>
            <Text variant="subtitle" className="mt-2">
              Buka kembali build up selesai untuk menambahkan master AWB/MAWB baru.
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
              <Pressable key={header.id} onPress={() => handleSelectHeader(header)}>
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
                    <Button variant="secondary" size="sm" onPress={() => handleSelectHeader(header)}>
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
              <Text className="text-sm text-muted-foreground">
                Belum ada Build Up selesai pada tanggal {flightDate}.
              </Text>
            </View>
          ) : null}
        </>
      )}

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
