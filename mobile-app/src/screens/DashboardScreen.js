import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppButton from '../components/AppButton';
import InfoCard from '../components/InfoCard';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../styles/theme';

const dashboardCards = [
  {
    title: 'Total Data',
    value: 24,
    description: 'Contoh ringkasan jumlah data yang dapat diganti dengan data API.',
  },
  {
    title: 'Pending',
    value: 7,
    description: 'Contoh data proses yang masih menunggu tindak lanjut.',
  },
  {
    title: 'Selesai',
    value: 17,
    description: 'Contoh data yang sudah selesai diproses.',
  },
];

/**
 * Renders the authenticated dashboard screen.
 * @param {{ navigation: object }} props - React Navigation screen props.
 * @returns {React.ReactElement} Dashboard screen.
 */
export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  /**
   * Opens the Build Up Checklist screen.
   * @returns {void}
   */
  function openBuildUpChecklist() {
    navigation.navigate('BuildUpChecklist');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Selamat datang</Text>
        <Text style={styles.title}>{user?.username || user?.email || 'User'}</Text>
        <Text style={styles.muted}>Dashboard awal untuk pengembangan MAU APP mobile.</Text>
      </View>

      <View style={styles.cardList}>
        {dashboardCards.map((card) => (
          <InfoCard key={card.title} title={card.title} value={card.value} description={card.description} />
        ))}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.eyebrow}>Menu</Text>
        <Pressable style={styles.menuItem} onPress={openBuildUpChecklist}>
          <View>
            <Text style={styles.menuTitle}>Build Up Checklist</Text>
            <Text style={styles.muted}>Form checklist awal untuk proses build up warehouse.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <AppButton title="Logout" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  hero: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: theme.spacing.xs,
  },
  muted: {
    color: theme.colors.muted,
    lineHeight: 20,
    marginTop: theme.spacing.xs,
  },
  cardList: {
    gap: theme.spacing.md,
  },
  menuSection: {
    gap: theme.spacing.sm,
  },
  menuItem: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  chevron: {
    color: theme.colors.primary,
    fontSize: 32,
  },
});
