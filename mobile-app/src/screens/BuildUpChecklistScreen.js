import React, { useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/layout/ScreenHeader';
import ScreenLayout from '../components/layout/ScreenLayout';
import { BarcodeScanner, Button, Card, CardContent, Input, Text } from '../components/ui';
import { useThemeColors } from '../styles/theme';

const initialForm = {
  mawbNumber: '',
  uldNumber: '',
  grossWeight: '',
};

const fields = [
  {
    key: 'mawbNumber',
    label: 'MAWB Number',
    placeholder: 'Enter MAWB number',
    icon: 'barcode-scan',
    keyboardType: 'default',
    scannerTitle: 'Scan AWB/MAWB Barcode',
    scannerDescription: 'Scan barcode pada dokumen AWB/MAWB untuk mengisi nomor otomatis.',
  },
  {
    key: 'uldNumber',
    label: 'ULD Number',
    placeholder: 'Enter ULD number',
    icon: 'cube-outline',
    keyboardType: 'default',
    scannerTitle: 'Scan ULD Barcode',
    scannerDescription: 'Scan barcode pada label ULD untuk mengisi nomor ULD otomatis.',
  },
  {
    key: 'grossWeight',
    label: 'Gross Weight',
    placeholder: 'Enter gross weight',
    icon: 'weight-kilogram',
    keyboardType: 'numeric',
  },
];

/**
 * Renders one rounded field for the Build Up Checklist form.
 * @param {{ field: object, value: string, onChangeText: Function, onScanPress?: Function }} props - Field props.
 * @returns {React.ReactElement} Checklist field.
 */
function ChecklistField({ field, value, onChangeText, onScanPress }) {
  const colors = useThemeColors();
  const canScan = Boolean(field.scannerTitle && onScanPress);

  return (
    <View className="gap-3">
      <Text variant="label">{field.label}</Text>
      <View
        className="min-h-[58px] flex-row items-center rounded-sm border border-border bg-card px-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <Input
          className="min-h-0 flex-1 border-0 bg-transparent px-0 py-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={field.placeholder}
          keyboardType={field.keyboardType}
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
 * Renders the Build Up Checklist form screen.
 * @param {{ onBack?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Build Up Checklist screen.
 */
export default function BuildUpChecklistScreen({ onBack }) {
  const [formData, setFormData] = useState(initialForm);
  const [scannerField, setScannerField] = useState(null);

  /**
   * Updates one checklist form field.
   * @param {string} fieldName - Field key.
   * @param {string} value - Field value.
   * @returns {void}
   */
  function updateField(fieldName, value) {
    setFormData((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }));
  }

  /**
   * Navigates back to the dashboard.
   * @returns {void}
   */
  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
  }

  /**
   * Opens the barcode scanner for a specific checklist field.
   * @param {object} field - Field metadata.
   * @returns {void}
   */
  function openScanner(field) {
    setScannerField(field);
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

  return (
    <ScreenLayout
      keyboardAware
      header={<ScreenHeader onBack={handleBack} onClose={handleBack} />}
      footer={
        <View className="px-5 pb-6 pt-3 web:self-center web:w-full web:max-w-[520px]">
          <Button variant="outline" size="lg">
            <Text>Next</Text>
          </Button>
        </View>
      }
    >
      <View>
        <Text variant="label" className="uppercase text-primary">
          Build Up
        </Text>
        <Text variant="title" className="mt-1">
          Checklist
        </Text>
        <Text variant="subtitle" className="mt-2">
          Isi data awal proses build up warehouse sebelum lanjut ke validasi backend.
        </Text>
      </View>

      <Card className="mt-8 rounded-sm bg-card/70">
        <CardContent className="gap-5 p-4">
          {fields.map((field) => (
            <ChecklistField
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChangeText={(value) => updateField(field.key, value)}
              onScanPress={field.scannerTitle ? () => openScanner(field) : undefined}
            />
          ))}
        </CardContent>
      </Card>

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
