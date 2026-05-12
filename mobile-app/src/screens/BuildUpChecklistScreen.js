import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppButton from '../components/AppButton';
import { theme } from '../styles/theme';

/**
 * Renders the initial Build Up Checklist form shell.
 * @param {{ navigation: object }} props - React Navigation screen props.
 * @returns {React.ReactElement} Build Up Checklist screen.
 */
export default function BuildUpChecklistScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>Warehouse</Text>
        <Text style={styles.title}>Build Up Checklist</Text>
        <Text style={styles.muted}>Form awal sudah disiapkan. Struktur input akan ditambahkan setelah checklist final disusun.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldTitle}>Checklist item</Text>
        <Text style={styles.muted}>Input menyusul sesuai format operasional yang akan disusun.</Text>
        <AppButton title="Simpan Checklist" disabled />
      </View>

      <AppButton title="Kembali ke Dashboard" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  intro: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  muted: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  fieldTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
