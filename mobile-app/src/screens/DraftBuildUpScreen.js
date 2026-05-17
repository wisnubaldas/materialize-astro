import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import ScreenHeader from '../components/layout/ScreenHeader';
import ScreenLayout from '../components/layout/ScreenLayout';
import { Button, Card, CardContent, DatePicker, Input, Separator, Text } from '../components/ui';
import {
  createBuildUpCheckDetail,
  createBuildUpCheckRincian,
  listBuildUpCheckDetails,
  listBuildUpCheckHeaders,
} from '../services/buildUpService';
import { useThemeColors } from '../styles/theme';
import {
  validateBuildUpCheckDetailForm,
  validateBuildUpCheckRincianForm,
} from '../utils/validators';

const initialDetailForm = {
  mawb: '',
  total_pieces: '',
  agent: '',
  remark: '',
};

const initialRincianForm = {
  pieces: '',
  weight: '',
};

const activePanel = {
  list: 'list',
  master: 'master',
  rincian: 'rincian',
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
 * Renders a reusable form input for the draft workflow.
 * @param {{ label: string, value: string, onChangeText: Function, placeholder: string, keyboardType?: string }} props - Input props.
 * @returns {React.ReactElement} Draft form input.
 */
function DraftInput({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="characters"
      />
    </View>
  );
}

/**
 * Renders the Draft Build Up screen for header search, detail, and rincian input.
 * @param {{ onBack?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Draft Build Up screen.
 */
export default function DraftBuildUpScreen({ onBack }) {
  const colors = useThemeColors();
  const [flightDate, setFlightDate] = useState('');
  const [headers, setHeaders] = useState([]);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [details, setDetails] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailForm, setDetailForm] = useState(initialDetailForm);
  const [rincianForm, setRincianForm] = useState(initialRincianForm);
  const [panel, setPanel] = useState(activePanel.list);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
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

  /**
   * Loads details for the selected header.
   * @param {object} header - Selected header row.
   * @returns {Promise<void>} Resolves after details are loaded.
   */
  async function openHeader(header) {
    setSelectedHeader(header);
    setSelectedDetail(null);
    setDetailForm(initialDetailForm);
    setRincianForm(initialRincianForm);
    setPanel(activePanel.list);
    setMessage('');
    setErrorMessage('');

    try {
      const rows = await listBuildUpCheckDetails(header.id);
      setDetails(rows);
    } catch (error) {
      console.error('[draft-build-up] Load details gagal', error);
      setErrorMessage(error?.message || 'Gagal memuat detail Build Up Check.');
    }
  }

  useEffect(() => {
    loadHeaders();
  }, []);

  /**
   * Saves a new MAWB detail for the selected header.
   * @returns {Promise<void>} Resolves after submit finishes.
   */
  async function handleSaveDetail() {
    const validation = validateBuildUpCheckDetailForm(detailForm);

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    try {
      const created = await createBuildUpCheckDetail(selectedHeader.id, {
        mawb: detailForm.mawb,
        total_pieces: Number(detailForm.total_pieces),
        agent: detailForm.agent,
        remark: detailForm.remark,
      });
      const rows = await listBuildUpCheckDetails(selectedHeader.id);
      setDetails(rows);
      setSelectedDetail(created);
      setDetailForm(initialDetailForm);
      setPanel(activePanel.rincian);
      setMessage('Detail MAWB berhasil disimpan. Lanjut isi rincian pieces.');
      setErrorMessage('');
    } catch (error) {
      console.error('[draft-build-up] Save detail gagal', error);
      setErrorMessage(error?.message || 'Gagal menyimpan detail.');
    }
  }

  /**
   * Saves one rincian row and refreshes detail progress.
   * @returns {Promise<void>} Resolves after submit finishes.
   */
  async function handleSaveRincian() {
    const validation = validateBuildUpCheckRincianForm(rincianForm);

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    try {
      const updated = await createBuildUpCheckRincian(selectedDetail.id, {
        pieces: Number(rincianForm.pieces),
        weight: rincianForm.weight === '' ? null : Number(rincianForm.weight),
      });
      const rows = await listBuildUpCheckDetails(selectedHeader.id);
      setDetails(rows);
      setSelectedDetail(updated);
      setRincianForm(initialRincianForm);
      setPanel(updated.is_completed ? activePanel.list : activePanel.rincian);
      setMessage(updated.is_completed ? 'Rincian detail sudah selesai.' : 'Rincian berhasil ditambahkan.');
      setErrorMessage('');
      loadHeaders();
    } catch (error) {
      console.error('[draft-build-up] Save rincian gagal', error);
      setErrorMessage(error?.message || 'Gagal menyimpan rincian.');
    }
  }

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
          <Pressable key={header.id} onPress={() => openHeader(header)}>
            <Card className="rounded-sm bg-card">
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

      {selectedHeader ? (
        <Card className="mt-6 rounded-sm bg-card">
          <CardContent className="gap-3 p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-foreground">
                  {selectedHeader.flight_no || '-'} / {selectedHeader.uld}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {selectedHeader.flight_date || '-'} - {selectedHeader.dest || '-'}
                </Text>
              </View>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  setPanel(activePanel.master);
                  setSelectedDetail(null);
                  setRincianForm(initialRincianForm);
                }}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.foreground} />
                <Text className="ml-2">Master</Text>
              </Button>
            </View>
            <Separator />
            <InfoLine
              label="Progress Header"
              value={`${selectedHeader.completed_pieces}/${selectedHeader.total_pieces}`}
            />
          </CardContent>
        </Card>
      ) : null}

      {selectedHeader ? (
        <Card className="mt-5 rounded-sm bg-card/70">
          <CardContent className="gap-4 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xl font-extrabold text-foreground">Master MAWB</Text>
              <Text className="text-xs font-semibold text-muted-foreground">
                {details.length} master
              </Text>
            </View>

            {details.length > 0 ? (
              <View className="gap-3">
                {details.map((detail) => (
                  <Pressable
                    key={detail.id}
                    onPress={() => {
                      setSelectedDetail(detail);
                      setPanel(detail.is_completed ? activePanel.list : activePanel.rincian);
                      setRincianForm(initialRincianForm);
                    }}
                  >
                    <View
                      className="rounded-sm border border-border bg-card p-4"
                      style={{
                        backgroundColor: colors.card,
                        borderColor:
                          selectedDetail?.id === detail.id ? colors.primary : colors.border,
                      }}
                    >
                      <View className="flex-row justify-between gap-3">
                        <Text className="flex-1 text-base font-extrabold text-foreground">
                          {detail.mawb}
                        </Text>
                        <Text
                          className={`text-xs font-bold ${
                            detail.is_completed ? 'text-lime' : 'text-red-600'
                          }`}
                        >
                          {detail.is_completed ? 'SELESAI' : 'BELUM'}
                        </Text>
                      </View>
                      <View className="mt-3 gap-1">
                        <InfoLine label="Agent" value={detail.agent} />
                        <InfoLine
                          label="Pieces"
                          value={`${detail.completed_pieces}/${detail.total_pieces}`}
                        />
                        <InfoLine label="Sisa" value={detail.remaining_pieces} />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className="rounded-sm border border-border bg-muted p-4">
                <Text className="text-sm text-muted-foreground">
                  Belum ada master MAWB. Tekan tombol Master untuk menambahkan.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      ) : null}

      {selectedHeader && panel === activePanel.master ? (
        <Card className="mt-5 rounded-sm bg-card/70">
          <CardContent className="gap-4 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xl font-extrabold text-foreground">Tambah Master</Text>
              <Button variant="ghost" size="sm" onPress={() => setPanel(activePanel.list)}>
                <Text>Batal</Text>
              </Button>
            </View>
            <DraftInput
              label="MAWB"
              value={detailForm.mawb}
              onChangeText={(value) => setDetailForm((current) => ({ ...current, mawb: value }))}
              placeholder="123-45678901"
            />
            <DraftInput
              label="Total Pieces"
              value={detailForm.total_pieces}
              onChangeText={(value) =>
                setDetailForm((current) => ({ ...current, total_pieces: value }))
              }
              placeholder="Total pieces MAWB"
              keyboardType="numeric"
            />
            <DraftInput
              label="Agent"
              value={detailForm.agent}
              onChangeText={(value) => setDetailForm((current) => ({ ...current, agent: value }))}
              placeholder="Agent"
            />
            <DraftInput
              label="Remark"
              value={detailForm.remark}
              onChangeText={(value) => setDetailForm((current) => ({ ...current, remark: value }))}
              placeholder="Catatan"
            />
            <Button onPress={handleSaveDetail}>
              <Text>Simpan Master</Text>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {selectedDetail && panel === activePanel.rincian ? (
        <Card className="mt-5 rounded-sm bg-card/70">
          <CardContent className="gap-4 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-xl font-extrabold text-foreground">Rincian Master</Text>
              <Button variant="ghost" size="sm" onPress={() => setPanel(activePanel.list)}>
                <Text>Tutup</Text>
              </Button>
            </View>
            <InfoLine label="MAWB" value={selectedDetail.mawb} />
            <InfoLine
              label="Progress"
              value={`${selectedDetail.completed_pieces}/${selectedDetail.total_pieces}`}
            />
            <InfoLine label="Sisa Pieces" value={selectedDetail.remaining_pieces} />
            {!selectedDetail.is_completed ? (
              <>
                <DraftInput
                  label="Pieces"
                  value={rincianForm.pieces}
                  onChangeText={(value) =>
                    setRincianForm((current) => ({ ...current, pieces: value }))
                  }
                  placeholder="Pieces rincian"
                  keyboardType="numeric"
                />
                <DraftInput
                  label="Weight"
                  value={rincianForm.weight}
                  onChangeText={(value) =>
                    setRincianForm((current) => ({ ...current, weight: value }))
                  }
                  placeholder="Weight rincian"
                  keyboardType="decimal-pad"
                />
                <Button variant="indigo" onPress={handleSaveRincian}>
                  <Text>Tambah Rincian</Text>
                </Button>
              </>
            ) : (
              <View className="rounded-sm border border-lime bg-lime/10 p-4">
                <Text className="text-sm font-semibold text-lime">
                  Master ini sudah selesai.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
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
