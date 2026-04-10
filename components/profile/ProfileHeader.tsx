import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radii, FontSize, FontWeight, Spacing } from '../../lib/constants';
import type { AppUser } from '../../stores/authStore';

interface ProfileHeaderProps {
  user: AppUser;
  booksReading: number;
  onSignOut: () => void;
}

export function ProfileHeader({ user, booksReading, onSignOut }: ProfileHeaderProps) {
  const initials = user.username.slice(0, 2).toUpperCase();
  const xp = user.xp;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{level}</Text>
        </View>
      </View>

      {/* Username */}
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.joinDate}>
        Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>

      {/* XP Bar */}
      <View style={styles.xpSection}>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>⚡ {xp} XP</Text>
          <Text style={styles.xpNextLabel}>{100 - xpInLevel} to next level</Text>
        </View>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${xpInLevel}%` }]} />
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{booksReading}</Text>
          <Text style={styles.statLabel}>Reading</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user.streak_days}</Text>
          <Text style={styles.statLabel}>Day Streak 🔥</Text>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.7}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  avatarFallback: {
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.accent,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  levelText: {
    color: '#000',
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
  },
  username: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  joinDate: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  xpSection: {
    width: '100%',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  xpNextLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  xpBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceRaised,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.sm,
    width: '100%',
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 2,
  },
  statNum: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  signOutBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    backgroundColor: Colors.dangerDim,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  signOutText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
