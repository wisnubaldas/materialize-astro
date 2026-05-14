import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenLayout from '../components/layout/ScreenLayout';
import { Button, Card, CardContent, Input, Text } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { validateLoginForm } from '../utils/validators';

/**
 * Renders a labeled login form input using the shared UI kit.
 * @param {{ label: string, value: string, onChangeText: Function, secureTextEntry?: boolean, keyboardType?: string, autoCapitalize?: string, placeholder?: string }} props - Field props.
 * @returns {React.ReactElement} Login field.
 */
function LoginField({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  placeholder = '',
}) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
      />
    </View>
  );
}

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
        <Text className="text-4xl font-black text-foreground">
          MAU<Text className="text-primary">.</Text>
        </Text>
        <Text variant="subtitle" className="mt-3">
          Mobile operation untuk gudang cargo lini 1 Bandara Soekarno Hatta.
        </Text>
      </View>

      <Card className="rounded-3xl">
        <CardContent className="gap-5">
          <View>
            <Text className="text-2xl font-extrabold text-foreground">Login operasional</Text>
            <Text variant="muted" className="mt-1">
              Masuk dengan akun MAU APP untuk melanjutkan pekerjaan gudang.
            </Text>
          </View>
          <LoginField
            label="Email"
            value={formData.email}
            placeholder="admin@admin.com"
            keyboardType="email-address"
            onChangeText={(value) => updateField('email', value)}
          />
          <LoginField
            label="Password"
            value={formData.password}
            placeholder="password123"
            secureTextEntry
            onChangeText={(value) => updateField('password', value)}
          />
          <Button size="lg" disabled={isSubmitting} onPress={handleLogin}>
            <Text>{isSubmitting ? 'Memproses...' : 'Login'}</Text>
          </Button>
        </CardContent>
      </Card>
    </ScreenLayout>
  );
}
