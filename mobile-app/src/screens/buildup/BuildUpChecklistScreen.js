import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import ScreenHeader from '../../components/layout/ScreenHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import {
  BarcodeScanner,
  Button,
  Card,
  CardContent,
  DatePicker,
  HeaderMetricCard,
  Input,
  Text,
} from '../../components/ui';
import { createBuildUpCheckHeader } from '../../services/buildUpService';
import { useThemeColors } from '../../styles/theme';
import { validateBuildUpChecklistForm } from '../../utils/validators';

const initialForm = {
  uld: '',
  airlines: '',
  flight_no: '',
  flightDate: '',
  dest: '',
  staff: '',
  supervisor: '',
};

const headerFields = [
  {
    key: 'uld',
    label: 'ULD',
    placeholder: 'Scan atau isi nomor ULD',
    icon: 'cube-outline',
    scannerTitle: 'Scan ULD Barcode',
    scannerDescription: 'Scan barcode pada label ULD.',
  },
  {
    key: 'airlines',
    label: 'Airlines',
    placeholder: 'Kode airlines',
    icon: 'airplane',
  },
  {
    key: 'flight_no',
    label: 'Flight No',
    placeholder: 'Nomor penerbangan',
    icon: 'airplane-takeoff',
  },
  {
    key: 'flightDate',
    label: 'Flight Date',
    placeholder: 'YYYY-MM-DD',
    icon: 'calendar-month',
    type: 'date',
  },
  {
    key: 'dest',
    label: 'Destination',
    placeholder: 'Tujuan',
    icon: 'map-marker-down',
  },
  {
    key: 'staff',
    label: 'Staff',
    placeholder: 'Nama staff',
    icon: 'account-outline',
  },
  {
    key: 'supervisor',
    label: 'Supervisor',
    placeholder: 'Nama supervisor',
    icon: 'account-tie-outline',
  },
];

/**
 * Renders a single Build Up Check header field.
 * @param {{ field: object, value: string, onChangeText: Function, onScanPress?: Function }} props - Field props.
 * @returns {React.ReactElement} Header input field.
 */
function HeaderField({ field, value, onChangeText, onScanPress }) {
  const colors = useThemeColors();
  const canScan = Boolean(field.scannerTitle && onScanPress);

  return (
    <View className="gap-3">
      <Text variant="label">{field.label}</Text>
      <View
        className="min-h-14.5 flex-row items-center rounded-sm border border-border bg-card px-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <Input
          className="min-h-0 flex-1 border-0 bg-transparent px-0 py-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={field.placeholder}
          keyboardType={field.keyboardType || 'default'}
          autoCapitalize="characters"
        />
        {canScan ? (
          <Button variant="secondary" size="sm" className="ml-3" onPress={onScanPress}>
            <MaterialCommunityIcons name="barcode-scan" size={18} color={colors.foreground} />
            <Text className="ml-2 text-sm font-semibold">Scan</Text>
          </Button>
        ) : (
          <MaterialCommunityIcons name={field.icon} size={24} color={colors.muted} />
        )}
      </View>
    </View>
  );
}

/**
 * Renders the Build Up Check header form screen.
 * @param {{ onBack?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Header form screen.
 */
export default function BuildUpChecklistScreen({ onBack }) {
  const [formData, setFormData] = useState(initialForm);
  const [scannerField, setScannerField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Updates one header form field.
   * @param {string} fieldName - Field key.
   * @param {string} value - Field value.
   * @returns {void}
   */
  function updateField(fieldName, value) {
    setFormData((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }));
    setErrorMessage('');
    setSuccessMessage('');
  }

  /**
   * Applies scanned barcode data to the active field and closes the scanner.
   * @param {string} scannedValue - Barcode payload.
   * @returns {void}
   */
  function handleScannedValue(scannedValue) {
    if (!scannerField?.key) {
      return;
    }

    updateField(scannerField.key, scannedValue);
    setScannerField(null);
  }

  /**
   * Validates and saves the Build Up Check header to the backend.
   * @returns {Promise<void>} Resolves after submit finishes.
   */
  async function handleSubmit() {
    const validation = validateBuildUpChecklistForm({
      ...formData,
      flightNo: formData.flight_no,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await createBuildUpCheckHeader({
        uld: formData.uld,
        airlines: formData.airlines,
        flight_no: formData.flight_no,
        flight_date: formData.flightDate,
        dest: formData.dest,
        staff: formData.staff,
        supervisor: formData.supervisor,
      });
      setFormData(initialForm);
      setSuccessMessage('Header Build Up Check berhasil disimpan.');
    } catch (error) {
      console.error('[build-up-check] Submit header gagal', error);
      setErrorMessage(error?.message || 'Header Build Up Check gagal disimpan.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout
      keyboardAware
      header={<ScreenHeader title="Build Up" onBack={onBack} onClose={onBack} />}
      footer={
        <View className="px-5 pb-6 pt-3 web:self-center web:w-full web:max-w-130">
          <Button variant="indigo" size="lg" disabled={isSubmitting} onPress={handleSubmit}>
            <Text>{isSubmitting ? 'Menyimpan...' : 'Simpan Header'}</Text>
          </Button>
        </View>
      }
    >
      <HeaderMetricCard
        title="Build Up Checklist"
        variant="violet"
        className="web:self-center web:w-full web:max-w-130"
      />

      <Card className="mt-8 rounded-sm bg-card/70">
        <CardContent className="gap-5 p-4">
          {headerFields.map((field) =>
            field.type === 'date' ? (
              <DatePicker
                key={field.key}
                label={field.label}
                value={formData[field.key]}
                onChange={(value) => updateField(field.key, value)}
                placeholder={field.placeholder}
              />
            ) : (
              <HeaderField
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChangeText={(value) => updateField(field.key, value)}
                onScanPress={field.scannerTitle ? () => setScannerField(field) : undefined}
              />
            )
          )}
        </CardContent>
      </Card>

      {errorMessage ? (
        <View className="mt-4 rounded-sm border border-destructive bg-red-50 p-4">
          <Text variant="error">{errorMessage}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View className="mt-4 rounded-sm border border-lime bg-lime/10 p-4">
          <Text className="text-sm font-semibold text-lime">{successMessage}</Text>
        </View>
      ) : null}

      <BarcodeScanner
        visible={Boolean(scannerField)}
        title={scannerField?.scannerTitle || 'Scan Barcode'}
        description={scannerField?.scannerDescription || ''}
        onClose={() => setScannerField(null)}
        onScanned={handleScannedValue}
      />
    </ScreenLayout>
  );
}
