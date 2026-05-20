import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import ScreenHeader from '../../components/layout/ScreenHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, CardContent, Input, Separator, Text } from '../../components/ui';
import {
  createBuildUpCheckDetail,
  listBuildUpCheckDetails,
} from '../../services/buildUpService';
import { useThemeColors } from '../../styles/theme';
import { validateBuildUpCheckDetailForm } from '../../utils/validators';

const initialMasterForm = {
  mawb: '',
  total_pieces: '',
  master_total_pieces: '',
  agent: '',
  remark: '',
};

const viewModes = {
  list: 'list',
  create: 'create',
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
 * Renders one Master MAWB card in the selected Build Up header.
 * @param {{ detail: object, onPress?: Function }} props - Master MAWB detail row.
 * @returns {React.ReactElement} Master MAWB card.
 */
function MasterAwbCard({ detail, onPress }) {
  const allocationLabel = detail.is_allocation_final ? 'DITUTUP' : 'AKTIF';
  const pieceTarget = detail.total_pieces || 'belum ditutup';

  return (
    <Pressable onPress={onPress}>
      <Card className="rounded-sm bg-card">
        <CardContent className="gap-3 p-4">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-lg font-extrabold text-foreground">{detail.mawb}</Text>
            <Text className={`text-xs font-bold ${detail.is_completed ? 'text-lime' : 'text-red-600'}`}>
              {detail.is_completed ? 'SELESAI' : 'BELUM'}
            </Text>
          </View>
          <View className="self-start rounded-sm bg-muted px-2 py-1">
            <Text className="text-xs font-extrabold text-muted-foreground">{allocationLabel}</Text>
          </View>
          {detail.is_split_uld ? (
            <View className="self-start rounded-sm bg-amber-100 px-2 py-1">
              <Text className="text-xs font-extrabold text-amber-700">
                SPLIT {detail.split_sequence || '-'}/{detail.split_total_uld || 1} ULD
              </Text>
            </View>
          ) : null}
          <View className="gap-1">
            <InfoLine label="Agent" value={detail.agent} />
            <InfoLine
              label="Total MAWB"
              value={detail.master_total_pieces || detail.total_pieces}
            />
            <InfoLine
              label="Pieces ULD"
              value={`${detail.completed_pieces}/${pieceTarget}`}
            />
            <InfoLine label="Sisa" value={detail.remaining_pieces} />
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

/**
 * Renders one Master AWB form input.
 * @param {{ label: string, value: string, onChangeText: Function, placeholder: string, keyboardType?: string, multiline?: boolean }} props - Input props.
 * @returns {React.ReactElement} Master AWB form input.
 */
function MasterInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="characters"
        multiline={multiline}
      />
    </View>
  );
}

/**
 * Renders Master MAWB list and create form for one selected Draft Build Up header.
 * @param {{ header: object, onBack?: Function, onOpenRincian?: Function }} props - Header and navigation callbacks.
 * @returns {React.ReactElement} Master MAWB list screen.
 */
export default function DraftBuildUpMasterAWBScreen({ header, onBack, onOpenRincian }) {
  const colors = useThemeColors();
  const [details, setDetails] = useState([]);
  const [mode, setMode] = useState(viewModes.list);
  const [form, setForm] = useState(initialMasterForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Loads Master MAWB rows for the selected Build Up header.
   * @returns {Promise<void>} Resolves after details are loaded.
   */
  async function loadDetails() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const rows = await listBuildUpCheckDetails(header.id);
      setDetails(rows);
    } catch (error) {
      console.error('[draft-build-up-master-awb] Load details gagal', error);
      setErrorMessage(error?.message || 'Gagal memuat Master MAWB.');
    } finally {
      setIsLoading(false);
    }
  }

  useFocusEffect(useCallback(() => {
    loadDetails();
  }, [header.id]));

  /**
   * Updates one Master AWB form field.
   * @param {string} key - Field key.
   * @param {string} value - Field value.
   * @returns {void}
   */
  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  /**
   * Switches the content area to Master AWB create mode.
   * @returns {void}
   */
  function openCreateMode() {
    setMode(viewModes.create);
    setMessage('');
    setErrorMessage('');
  }

  /**
   * Returns to the Master MAWB list without leaving the selected header screen.
   * @returns {void}
   */
  function closeCreateMode() {
    setMode(viewModes.list);
    setForm(initialMasterForm);
    setErrorMessage('');
  }

  /**
   * Validates and saves a new Master AWB under the selected Build Up header.
   * @returns {Promise<void>} Resolves after submit finishes.
   */
  async function handleSaveMaster() {
    const validation = validateBuildUpCheckDetailForm(form);

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      await createBuildUpCheckDetail(header.id, {
        mawb: form.mawb,
        total_pieces: form.total_pieces === '' ? null : Number(form.total_pieces),
        master_total_pieces: Number(form.master_total_pieces),
        agent: form.agent,
        remark: form.remark,
      });
      setForm(initialMasterForm);
      setMode(viewModes.list);
      setMessage('Master AWB berhasil ditambahkan.');
      await loadDetails();
    } catch (error) {
      console.error('[draft-build-up-master-awb] Save master gagal', error);
      setErrorMessage(error?.message || 'Gagal menyimpan Master AWB.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout
      keyboardAware
      header={<ScreenHeader title="Draft Build Up" onBack={onBack} onClose={onBack} />}
    >
      <Card className="rounded-sm bg-card">
        <CardContent className="gap-4 p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-foreground">
                {header.flight_no || '-'} / {header.uld || '-'}
              </Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                {header.flight_date || '-'} - {header.dest || '-'}
              </Text>
            </View>
            <Button variant="secondary" size="sm" onPress={openCreateMode}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.foreground} />
              <Text className="ml-2">Master</Text>
            </Button>
          </View>
          <Separator />
          <InfoLine
            label="Progress Header"
            value={`${header.completed_pieces || 0}/${header.total_pieces || 0}`}
          />
        </CardContent>
      </Card>

      {mode === viewModes.create ? (
        <Card className="mt-6 rounded-sm bg-card/70">
          <CardContent className="gap-4 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-2xl font-extrabold text-foreground">Tambah Master</Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  Isi data MAWB untuk header Build Up ini.
                </Text>
              </View>
              <Button variant="ghost" size="sm" onPress={closeCreateMode}>
                <Text>Batal</Text>
              </Button>
            </View>

            <MasterInput
              label="MAWB"
              value={form.mawb}
              onChangeText={(value) => updateForm('mawb', value)}
              placeholder="123-45678901"
            />
            <MasterInput
              label="Pieces ULD Ini"
              value={form.total_pieces}
              onChangeText={(value) => updateForm('total_pieces', value)}
              placeholder="Opsional, isi jika sudah pasti"
              keyboardType="numeric"
            />
            <MasterInput
              label="Total Pieces MAWB"
              value={form.master_total_pieces}
              onChangeText={(value) => updateForm('master_total_pieces', value)}
              placeholder="Total pieces MAWB asli"
              keyboardType="numeric"
            />
            <MasterInput
              label="Agent"
              value={form.agent}
              onChangeText={(value) => updateForm('agent', value)}
              placeholder="Nama agent"
            />
            <MasterInput
              label="Remark"
              value={form.remark}
              onChangeText={(value) => updateForm('remark', value)}
              placeholder="Catatan opsional"
              multiline
            />

            <Button variant="indigo" disabled={isSubmitting} onPress={handleSaveMaster}>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2">{isSubmitting ? 'Menyimpan...' : 'Simpan Master'}</Text>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 rounded-sm bg-card/70">
          <CardContent className="gap-4 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-2xl font-extrabold text-foreground">Master MAWB</Text>
              <Text className="text-xs font-semibold text-muted-foreground">
                {isLoading ? 'Memuat...' : `${details.length} master`}
              </Text>
            </View>

            {details.length > 0 ? (
              <View className="gap-3">
                {details.map((detail) => (
                  <MasterAwbCard
                    key={detail.id}
                    detail={detail}
                    onPress={() => {
                      if (!detail.is_completed && onOpenRincian) {
                        onOpenRincian(detail);
                      }
                    }}
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-sm border border-border bg-muted p-4">
                <Text className="text-sm text-muted-foreground">
                  Belum ada Master MAWB untuk header ini.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
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
