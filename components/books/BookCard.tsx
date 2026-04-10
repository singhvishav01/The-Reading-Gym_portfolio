import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Radii, FontSize, Spacing } from '../../lib/constants';
import type { GoogleBook } from '../../lib/googleBooks';

interface BookCardProps {
  book: GoogleBook;
  onPress: () => void;
}

export function BookCard({ book, onPress }: BookCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <View style={styles.coverWrapper}>
        {book.cover ? (
          <Image source={{ uri: book.cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <Text style={styles.coverFallbackText}>📖</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        {book.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {book.description.replace(/<[^>]*>/g, '')}
          </Text>
        ) : null}
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Open Room →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  coverWrapper: {
    width: 76,
    height: 110,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: Colors.surfaceRaised,
  },
  cover: { width: '100%', height: '100%' },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceRaised,
  },
  coverFallbackText: { fontSize: 32 },
  info: { flex: 1, justifyContent: 'space-between', gap: Spacing.xs },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    lineHeight: 20,
  },
  author: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  description: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
    flex: 1,
  },
  cta: {
    marginTop: Spacing.xs,
  },
  ctaText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
