import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Radii, FontSize, FontWeight, Spacing } from '../../lib/constants';

interface UserCardProps {
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio?: string;
    xp?: number;
  };
  friendshipStatus: 'none' | 'pending' | 'accepted' | 'loading';
  onAddFriend: () => void;
}

export function UserCard({ user, friendshipStatus, onAddFriend }: UserCardProps) {
  const initials = user.username.slice(0, 2).toUpperCase();
  const level = Math.floor((user.xp ?? 0) / 100) + 1;

  const buttonLabel =
    friendshipStatus === 'accepted' ? 'Friends ✓' :
    friendshipStatus === 'pending' ? 'Requested' :
    'Add Friend';

  const buttonDisabled = friendshipStatus === 'accepted' || friendshipStatus === 'pending' || friendshipStatus === 'loading';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{user.username}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{level}</Text>
            </View>
          </View>
          {user.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            friendshipStatus === 'accepted' && styles.actionBtnFriends,
            friendshipStatus === 'pending' && styles.actionBtnPending,
          ]}
          onPress={onAddFriend}
          disabled={buttonDisabled}
          activeOpacity={0.7}
        >
          {friendshipStatus === 'loading' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[
              styles.actionBtnText,
              friendshipStatus === 'accepted' && styles.actionBtnTextFriends,
              friendshipStatus === 'pending' && styles.actionBtnTextPending,
            ]}>
              {buttonLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  avatarFallback: {
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  username: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  levelBadge: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  levelText: {
    color: '#000',
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
  },
  bio: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    minWidth: 90,
    alignItems: 'center',
  },
  actionBtnFriends: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  actionBtnPending: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  actionBtnTextFriends: {
    color: Colors.textMuted,
  },
  actionBtnTextPending: {
    color: Colors.textMuted,
  },
});
