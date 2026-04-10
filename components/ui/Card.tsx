import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors, Radii, Spacing } from '../../lib/constants';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'raised' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`pad_${padding}`],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  variant_default: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
  },
  variant_raised: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
  },
  variant_accent: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  pad_none: { padding: 0 },
  pad_sm: { padding: Spacing.sm },
  pad_md: { padding: Spacing.md },
  pad_lg: { padding: Spacing.lg },
});
