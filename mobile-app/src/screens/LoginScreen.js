import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../styles/theme';
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>M</Text>
        </View>
        <Text style={styles.title}>MAU APP</Text>
        <Text style={styles.subtitle}>Aplikasi untuk kebutuhan gudang lini 1</Text>
      </View>

      <View style={styles.card}>
        <AppInput
          label="Email"
          value={formData.email}
          keyboardType="email-address"
          onChangeText={(value) => updateField('email', value)}
        />
        <AppInput
          label="Password"
          value={formData.password}
          secureTextEntry
          onChangeText={(value) => updateField('password', value)}
        />
        <AppButton title="Login" loading={isSubmitting} onPress={handleLogin} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  brand: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
