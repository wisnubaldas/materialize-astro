import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import ScreenLayout from '../components/layout/ScreenLayout';
import { Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { validateLoginForm } from '../utils/validators';

/**
 * Renders the authentication screen.
 * @returns {React.ReactElement} Login screen.
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Updates one login form field.
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
   * Validates and submits login credentials.
   * @returns {Promise<void>} Resolves after login attempt finishes.
   */
  async function handleLogin() {
    const validation = validateLoginForm(formData);

    if (!validation.isValid) {
      Alert.alert('Login belum lengkap', validation.message);
      return;
    }

    try {
      setIsSubmitting(true);
      await login(formData);
    } catch (error) {
      Alert.alert('Login gagal', error.message || 'Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout keyboardAware contentClassName="web:max-w-[440px]" scrollContentClassName="justify-center">
      <View className="mb-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
          <MaterialCommunityIcons name="warehouse" size={30} color="#FFFFFF" />
        </View>
        <Text className="text-4xl font-black text-slate-950">
          MAU<Text className="text-blue-600">.</Text>
        </Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          Mobile operation untuk gudang cargo lini 1 Bandara Soekarno Hatta.
        </Text>
      </View>

      <Card className="rounded-3xl">
        <CardContent className="gap-5">
          <View>
            <Text className="text-2xl font-extrabold text-slate-950">Login operasional</Text>
            <Text className="mt-1 text-sm leading-5 text-slate-500">
              Masuk dengan akun MAU APP untuk melanjutkan pekerjaan gudang.
            </Text>
          </View>
          <AppInput
            label="Email"
            value={formData.email}
            placeholder="admin@admin.com"
            keyboardType="email-address"
            onChangeText={(value) => updateField('email', value)}
          />
          <AppInput
            label="Password"
            value={formData.password}
            placeholder="password123"
            secureTextEntry
            onChangeText={(value) => updateField('password', value)}
          />
          <AppButton title="Login" loading={isSubmitting} onPress={handleLogin} />
        </CardContent>
      </Card>
    </ScreenLayout>
  );
}
