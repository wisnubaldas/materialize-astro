import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../styles/theme';

/**
 * Displays a compact dashboard information card.
 * @param {{ title: string, value: string|number, description: string }} props - Card content.
 * @returns {React.ReactElement} Information card.
 */
export default function InfoCard({ title, value, description }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  description: {
    color: theme.colors.muted,
    lineHeight: 20,
  },
});
