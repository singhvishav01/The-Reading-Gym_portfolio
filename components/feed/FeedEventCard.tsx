import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, FontSize, FontWeight, Spacing } from '../../lib/constants';
import type { FeedEvent } from '../../stores/feedStore';

interface FeedEventCardProps {
  event: FeedEvent;
  cardHeight: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildMessage(event: FeedEvent): string {
  const user = event.users?.username ?? 'Someone';
  const title = event.books?.title ?? event.metadata?.book_title ?? 'a book';

  switch (event.event_type) {
    case 'chapter_progress': {
      const ch = event.metadata?.chapter_number;
      return `${user} reached Chapter ${ch} of ${title}`;
    }
    case 'room_joined':
      return `${user} joined the reading room for ${title}`;
    case 'chapter_reaction': {
      const emoji = event.metadata?.reaction_emoji ?? '❤️';
      const ch = event.metadata?.chapter_number;
      return `${user} reacted ${emoji} to Chapter ${ch} of ${title}`;
    }
    case 'book_completed':
      return `${user} just finished reading ${title}! 🎉`;
    default:
      return `${user} did something in ${title}`;
  }
}

function EventEmoji({ type }: { type: FeedEvent['event_type'] }) {
  const icons: Record<FeedEvent['event_type'], string> = {
    chapter_progress: '📖',
    room_joined: '🚪',
    chapter_reaction: '💬',
    book_completed: '🏆',
    user_post: '📸',
  };
  return <Text style={{ fontSize: 22 }}>{icons[type]}</Text>;
}

export function FeedEventCard({ event, cardHeight }: FeedEventCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const avatarUrl = event.users?.avatar_url;
  const username = event.users?.username ?? '?';
  const initials = username.slice(0, 2).toUpperCase();
  const isPost = event.event_type === 'user_post';
  const [liked, setLiked] = useState(false);

  const imageUrl = event.metadata?.image_url ?? event.metadata?.book_cover ?? event.books?.cover_url;
  const milestoneText = event.metadata?.milestone_text;
  const milestoneType = event.metadata?.milestone_type;
  let badgeIcon = '📝';
  if (milestoneType === 'started') badgeIcon = '📖';
  if (milestoneType === 'chapter') badgeIcon = '🔖';
  if (milestoneType === 'completed') badgeIcon = '🏆';

  // The image is a 1:1 square = screenWidth × screenWidth
  const imageSize = screenWidth;

  return (
    <View style={[styles.card, { height: cardHeight }]}>

      {/* ── Header Row ── */}
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerUsername}>{username}</Text>
          {isPost && event.metadata?.book_title && (
            <Text style={styles.headerSub} numberOfLines={1}>
              Reading {event.metadata.book_title}
            </Text>
          )}
          {!isPost && (
            <Text style={styles.headerSub} numberOfLines={1}>
              {timeAgo(event.created_at)}
            </Text>
          )}
        </View>
        {isPost && <Text style={styles.headerTime}>{timeAgo(event.created_at)}</Text>}
        {!isPost && <EventEmoji type={event.event_type} />}
      </View>

      {/* ── 1:1 Image (Post) or Message (System Event) ── */}
      {isPost ? (
        <>
          {imageUrl ? (
            <View style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              {milestoneText && (
                <View style={styles.milestoneBadge}>
                  <Text style={styles.milestoneText}>{badgeIcon} {milestoneText}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.imageContainer, styles.imageFallback, { width: imageSize, height: imageSize }]}>
              <Text style={styles.fallbackEmoji}>📚</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.systemMessageArea}>
          <Text style={styles.systemMessage}>{buildMessage(event)}</Text>
          {event.books?.cover_url && (
            <Image
              source={{ uri: event.books.cover_url }}
              style={styles.systemCover}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* ── Actions Row ── */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.actionBtn}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={28}
            color={liked ? Colors.danger : Colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={25} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={25} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bookmark-outline" size={25} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* ── Caption / Book Tag ── */}
      <View style={styles.captionArea}>
        {isPost && event.metadata?.caption ? (
          <Text style={styles.captionText} numberOfLines={2}>
            <Text style={styles.captionUsername}>{username}</Text>{' '}
            {event.metadata.caption}
          </Text>
        ) : null}
        {event.metadata?.book_title && !event.metadata?.caption && (
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Ionicons name="book-outline" size={12} color={Colors.accent} />
              <Text style={styles.tagText}>{event.metadata.book_title}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerUsername: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  headerTime: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  // ── Image ──
  imageContainer: {
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  fallbackEmoji: {
    fontSize: 64,
    opacity: 0.3,
  },
  milestoneBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  milestoneText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // ── System Event ──
  systemMessageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  systemMessage: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    lineHeight: 28,
  },
  systemCover: {
    width: 120,
    height: 180,
    borderRadius: Radii.md,
  },

  // ── Actions ──
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.md,
  },
  actionBtn: {
    padding: 2,
  },

  // ── Caption ──
  captionArea: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  captionText: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  captionUsername: {
    fontWeight: '700',
    color: Colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    gap: 4,
  },
  tagText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
