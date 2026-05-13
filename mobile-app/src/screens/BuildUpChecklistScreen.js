import React, { useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import ScreenHeader from '../components/layout/ScreenHeader';
import ScreenLayout from '../components/layout/ScreenLayout';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';

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
  },
  {
    key: 'uldNumber',
    label: 'ULD Number',
    placeholder: 'Enter ULD number',
    icon: 'cube-outline',
    keyboardType: 'default',
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
 * @param {{ field: object, value: string, onChangeText: Function }} props - Field props.
 * @returns {React.ReactElement} Checklist field.
 */
function ChecklistField({ field, value, onChangeText }) {
  return (
    <View className="gap-3">
      <Text variant="label">{field.label}</Text>
      <View className="min-h-[58px] flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
        <Input
          className="min-h-0 flex-1 border-0 bg-transparent px-0 py-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={field.placeholder}
          keyboardType={field.keyboardType}
          autoCapitalize="characters"
        />
        <MaterialCommunityIcons name={field.icon} size={24} color="#64748B" />
      </View>
    </View>
  );
}

/**
 * Renders the Build Up Checklist form screen.
 * @param {{ navigation?: object, onBack?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Build Up Checklist screen.
 */
export default function BuildUpChecklistScreen({ navigation, onBack }) {
  const [formData, setFormData] = useState(initialForm);

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

    if (navigation?.goBack) {
      navigation.goBack();
    }
  }

  return (
    <ScreenLayout
      keyboardAware
      header={<ScreenHeader onBack={handleBack} onClose={handleBack} />}
      footer={
        <View className="px-5 pb-6 pt-3 web:self-center web:w-full web:max-w-[520px]">
          <AppButton title="Next" variant="light" />
        </View>
      }
    >
      <View>
        <Text variant="label" className="uppercase text-blue-600">
          Build Up
        </Text>
        <Text variant="title" className="mt-1">
          Checklist
        </Text>
        <Text variant="subtitle" className="mt-2">
          Isi data awal proses build up warehouse sebelum lanjut ke validasi backend.
        </Text>
      </View>

      <View className="mt-8 gap-5 rounded-3xl border border-slate-200 bg-white/70 p-4">
        {fields.map((field) => (
          <ChecklistField
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChangeText={(value) => updateField(field.key, value)}
          />
        ))}
      </View>
    </ScreenLayout>
  );
}
