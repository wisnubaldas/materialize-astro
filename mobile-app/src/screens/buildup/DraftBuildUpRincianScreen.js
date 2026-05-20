import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import ScreenHeader from '../../components/layout/ScreenHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, CardContent, Input, Separator, Text } from '../../components/ui';
import {
  closeBuildUpCheckDetailAllocation,
  createBuildUpCheckRincian,
} from '../../services/buildUpService';
import { validateBuildUpCheckRincianForm } from '../../utils/validators';

const initialForm = {
  pieces: '',
  weight: '',
};

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
 * Renders one rincian form input.
 * @param {{ label: string, value: string, onChangeText: Function, placeholder: string, keyboardType?: string }} props - Input props.
 * @returns {React.ReactElement} Form input row.
 */
function RincianInput({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );
}

/**
 * Renders the Build Up rincian input screen for one Master AWB.
 * @param {{ header: object, detail: object, onBack?: Function }} props - Header, detail, and navigation callbacks.
 * @returns {React.ReactElement} Build Up rincian input screen.
 */
export default function DraftBuildUpRincianScreen({ header, detail, onBack }) {
  const [activeDetail, setActiveDetail] = useState(detail);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosingAllocation, setIsClosingAllocation] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Updates one rincian form field.
   * @param {string} key - Field key.
   * @param {string} value - Field value.
   * @returns {void}
   */
  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  /**
   * Validates and submits one rincian row for the selected Master AWB.
   * @returns {Promise<void>} Resolves after submit finishes.
   */
  async function handleSubmit() {
    const validation = validateBuildUpCheckRincianForm(form);

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');

    try {
      const updated = await createBuildUpCheckRincian(activeDetail.id, {
        pieces: Number(form.pieces),
        weight: form.weight === '' ? null : Number(form.weight),
      });
      setActiveDetail(updated);
      setForm(initialForm);
      setMessage(
        updated.is_completed ? 'Rincian master sudah selesai.' : 'Rincian berhasil ditambahkan.'
      );
    } catch (error) {
      console.error('[draft-build-up-rincian] Save rincian gagal', error);
      setErrorMessage(error?.message || 'Gagal menyimpan rincian.');
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Closes the current ULD allocation using entered actual pieces.
   * @returns {Promise<void>} Resolves after allocation is closed.
   */
  async function handleCloseAllocation() {
    if (activeDetail.completed_pieces <= 0) {
      setErrorMessage('Input rincian pieces terlebih dahulu sebelum menutup alokasi ULD.');
      return;
    }

    setIsClosingAllocation(true);
    setMessage('');
    setErrorMessage('');

    try {
      const updated = await closeBuildUpCheckDetailAllocation(activeDetail.id);
      setActiveDetail(updated);
      setMessage(
        updated.master_remaining_pieces > 0
          ? `Alokasi ULD ditutup. Sisa MAWB ${updated.master_remaining_pieces} pieces bisa dilanjutkan di ULD lain.`
          : 'Alokasi ULD ditutup dan Master AWB sudah selesai.'
      );
    } catch (error) {
      console.error('[draft-build-up-rincian] Close allocation gagal', error);
      setErrorMessage(error?.message || 'Gagal menutup alokasi ULD.');
    } finally {
      setIsClosingAllocation(false);
    }
  }

  return (
    <ScreenLayout
      keyboardAware
      header={<ScreenHeader title="Rincian Build Up" onBack={onBack} onClose={onBack} />}
    >
      <Card className="rounded-sm bg-card">
        <CardContent className="gap-4 p-4">
          <View>
            <Text className="text-lg font-extrabold text-foreground">
              {header.flight_no || '-'} / {header.uld || '-'}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {header.flight_date || '-'} - {header.dest || '-'}
            </Text>
          </View>
          <Separator />
          <InfoLine label="MAWB" value={activeDetail.mawb} />
          <InfoLine label="Agent" value={activeDetail.agent} />
          {activeDetail.is_split_uld ? (
            <InfoLine
              label="Split ULD"
              value={`${activeDetail.split_sequence || '-'}/${activeDetail.split_total_uld || 1}`}
            />
          ) : null}
          <InfoLine
            label="Total MAWB"
            value={activeDetail.master_total_pieces || activeDetail.total_pieces}
          />
          <InfoLine
            label="Progress ULD"
            value={`${activeDetail.completed_pieces}/${activeDetail.total_pieces || 'belum ditutup'}`}
          />
          <InfoLine label="Sisa MAWB" value={activeDetail.master_remaining_pieces} />
          <InfoLine
            label="Status Alokasi"
            value={activeDetail.is_allocation_final ? 'Ditutup' : 'Aktif'}
          />
          <InfoLine label="Sisa Pieces" value={activeDetail.remaining_pieces} />
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-sm bg-card/70">
        <CardContent className="gap-4 p-4">
          <View>
            <Text className="text-2xl font-extrabold text-foreground">Input Rincian</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Tambahkan pieces dan weight untuk master AWB yang dipilih.
            </Text>
          </View>

          {!activeDetail.is_completed && !activeDetail.is_allocation_final ? (
            <>
              <RincianInput
                label="Pieces"
                value={form.pieces}
                onChangeText={(value) => updateForm('pieces', value)}
                placeholder="Pieces rincian"
                keyboardType="numeric"
              />
              <RincianInput
                label="Weight"
                value={form.weight}
                onChangeText={(value) => updateForm('weight', value)}
                placeholder="Weight rincian"
                keyboardType="decimal-pad"
              />
              <Button variant="indigo" disabled={isSubmitting} onPress={handleSubmit}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text className="ml-2">{isSubmitting ? 'Menyimpan...' : 'Tambah Rincian'}</Text>
              </Button>
              <Button
                variant="outline"
                disabled={isClosingAllocation || activeDetail.completed_pieces <= 0}
                onPress={handleCloseAllocation}
              >
                <MaterialCommunityIcons name="archive-check-outline" size={20} />
                <Text className="ml-2">
                  {isClosingAllocation ? 'Menutup...' : 'Tutup Alokasi ULD'}
                </Text>
              </Button>
            </>
          ) : (
            <View className="rounded-sm border border-lime bg-lime/10 p-4">
              <Text className="text-sm font-semibold text-lime">
                {activeDetail.master_remaining_pieces > 0
                  ? 'Alokasi ULD ini sudah ditutup.'
                  : 'Master ini sudah selesai.'}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

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
