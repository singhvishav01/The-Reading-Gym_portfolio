import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, FontSize } from '../../lib/constants';

interface AvatarProps {
  uri?: string | null;
  username?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ uri, username, size = 40, style }: AvatarProps) {
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : '??';

  const fontSize = size * 0.35;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.surfaceRaised,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.accentLight,
    fontWeight: '700',
  },
});
