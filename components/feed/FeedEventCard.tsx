import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Radii, FontSize, Spacing } from '../../lib/constants';
import type { FeedEvent } from '../../stores/feedStore';

interface FeedEventCardProps {
  event: FeedEvent;
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

function EventIcon({ type }: { type: FeedEvent['event_type'] }) {
  const icons: Record<FeedEvent['event_type'], string> = {
    chapter_progress: '📖',
    room_joined: '🚪',
    chapter_reaction: '💬',
    book_completed: '🏆',
    user_post: '📸',
  };
  return <Text style={styles.icon}>{icons[type]}</Text>;
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

export function FeedEventCard({ event }: FeedEventCardProps) {
  const avatarUrl = event.users?.avatar_url;
  const username = event.users?.username ?? '?';
  const initials = username.slice(0, 2).toUpperCase();

  if (event.event_type === 'user_post') {
    const postImageUrl = event.metadata?.image_url ?? event.metadata?.book_cover ?? event.books?.cover_url;
    
    return (
      <View style={styles.igCard}>
        <View style={styles.igHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.igAvatar} />
          ) : (
            <View style={[styles.igAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.igUsername}>{username}</Text>
            {event.metadata?.book_title && (
              <Text style={styles.igSubtitle}>Reading {event.metadata.book_title}</Text>
            )}
          </View>
          <Text style={styles.igTime}>{timeAgo(event.created_at)}</Text>
        </View>
        
        {postImageUrl ? (
          <Image 
            source={{ uri: postImageUrl }} 
            style={styles.igImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.igImage, styles.igImageFallback]}>
             <Text style={styles.emptyEmoji}>📚</Text>
          </View>
        )}
        
        <View style={styles.igFooter}>
          {event.metadata?.caption ? (
            <Text style={styles.igCaption}>
              <Text style={styles.igUsernameInline}>{username}</Text> {event.metadata.caption}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Avatar */}
      <View style={styles.avatarCol}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.timeline} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <EventIcon type={event.event_type} />
          <Text style={styles.message} numberOfLines={3}>
            {buildMessage(event)}
          </Text>
        </View>
        <View style={styles.footer}>
          {event.books?.cover_url ? (
            <Image source={{ uri: event.books.cover_url }} style={styles.miniCover} />
          ) : null}
          <Text style={styles.time}>{timeAgo(event.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  avatarCol: {
    alignItems: 'center',
    width: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  avatarText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  timeline: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.surfaceBorder,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
  },
  message: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  miniCover: {
    width: 20,
    height: 28,
    borderRadius: 3,
  },
  time: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  igCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm,
  },
  igHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  igAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  igUsername: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  igSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  igTime: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginLeft: 'auto',
  },
  igImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.bg,
  },
  igImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
  },
  igFooter: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  igCaption: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  igUsernameInline: {
    fontWeight: 'bold',
    color: Colors.text,
  },
});
