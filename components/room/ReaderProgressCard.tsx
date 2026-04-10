import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Radii, FontSize, Spacing } from '../../lib/constants';
import type { ReaderProgress } from '../../stores/roomStore';

interface ReaderProgressCardProps {
  reader: ReaderProgress;
  isMe: boolean;
  rank: number;
}

export function ReaderProgressCard({ reader, isMe, rank }: ReaderProgressCardProps) {
  const avatarUrl = reader.users?.avatar_url;
  const username = reader.users?.username ?? 'Reader';
  const initials = username.slice(0, 2).toUpperCase();

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      {/* Rank */}
      <Text style={styles.rank}>{rankEmoji}</Text>

      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, isMe && styles.avatarFallbackMe]}>
          <Text style={[styles.avatarText, isMe && styles.avatarTextMe]}>{initials}</Text>
        </View>
      )}

      {/* Name */}
      <Text style={[styles.username, isMe && styles.usernameMe]} numberOfLines={1}>
        {username}
        {isMe ? ' (you)' : ''}
      </Text>

      {/* Chapter badge */}
      <View style={[styles.badge, isMe && styles.badgeMe]}>
        <Text style={[styles.badgeText, isMe && styles.badgeTextMe]}>
          Ch. {reader.current_chapter}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  rowMe: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  rank: {
    fontSize: FontSize.md,
    width: 28,
    textAlign: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackMe: {
    backgroundColor: Colors.accentGlow,
  },
  avatarText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  avatarTextMe: {
    color: Colors.accent,
  },
  username: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  usernameMe: {
    color: Colors.text,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.surfaceBorder,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  badgeMe: {
    backgroundColor: Colors.accent,
  },
  badgeText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  badgeTextMe: {
    color: '#fff',
  },
});
