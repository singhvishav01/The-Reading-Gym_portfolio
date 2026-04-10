import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, FontSize, Spacing } from '../../lib/constants';

type BadgeVariant = 'accent' | 'gold' | 'success' | 'muted' | 'danger';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'accent', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  accent: { backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: Colors.accent },
  text_accent: { color: Colors.accentLight },
  gold: { backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold },
  text_gold: { color: Colors.gold },
  success: { backgroundColor: Colors.successDim, borderWidth: 1, borderColor: Colors.success },
  text_success: { color: Colors.success },
  muted: { backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.surfaceBorder },
  text_muted: { color: Colors.textMuted },
  danger: { backgroundColor: Colors.dangerDim, borderWidth: 1, borderColor: Colors.danger },
  text_danger: { color: Colors.danger },
});
