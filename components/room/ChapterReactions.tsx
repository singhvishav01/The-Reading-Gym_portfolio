import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radii, FontSize, FontWeight, Spacing, REACTIONS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';

interface ChapterReactionsProps {
  bookId: string;
}

export function ChapterReactions({ bookId }: ChapterReactionsProps) {
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [saving, setSaving] = useState<string | null>(null);
  const { session } = useAuthStore();
  const { myProgress, reactions, upsertReaction } = useRoomStore();

  const maxChapter = myProgress?.current_chapter ?? 0;

  // Reactions for the selected chapter
  const chapterReactions = reactions.filter((r) => r.chapter_number === selectedChapter);

  function reactionCount(type: string) {
    return chapterReactions.filter((r) => r.reaction_type === type).length;
  }

  function myReaction(type: string) {
    return chapterReactions.some(
      (r) => r.reaction_type === type && r.user_id === session?.user.id
    );
  }

  async function toggleReaction(type: string, emoji: string) {
    if (!session) return;
    const isActive = myReaction(type);
    setSaving(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isActive) {
      // Remove reaction
      const existing = chapterReactions.find(
        (r) => r.reaction_type === type && r.user_id === session.user.id
      );
      if (existing) {
        await supabase.from('chapter_reactions').delete().eq('id', existing.id);
        useRoomStore.getState().removeReaction(existing.id);
      }
    } else {
      // Add reaction
      const { data, error } = await supabase
        .from('chapter_reactions')
        .insert({
          user_id: session.user.id,
          book_id: bookId,
          chapter_number: selectedChapter,
          reaction_type: type,
        })
        .select()
        .single();

      if (!error && data) {
        upsertReaction(data as any);

        // Feed event
        await supabase.from('feed_events').insert({
          user_id: session.user.id,
          event_type: 'chapter_reaction',
          book_id: bookId,
          metadata: {
            chapter_number: selectedChapter,
            reaction_type: type,
            reaction_emoji: emoji,
            book_title: useRoomStore.getState().book?.title,
          },
        });
      }
    }
    setSaving(null);
  }

  if (maxChapter === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Track a chapter to unlock reactions 🔒</Text>
      </View>
    );
  }

  const chapters = Array.from({ length: maxChapter }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Chapter Reactions</Text>

      {/* Chapter selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chaptersScroll}
      >
        {chapters.map((ch) => (
          <TouchableOpacity
            key={ch}
            style={[styles.chapterChip, selectedChapter === ch && styles.chapterChipActive]}
            onPress={() => setSelectedChapter(ch)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.chapterChipText, selectedChapter === ch && styles.chapterChipTextActive]}
            >
              Ch. {ch}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reaction buttons */}
      <View style={styles.reactionsGrid}>
        {REACTIONS.map((r) => {
          const active = myReaction(r.type);
          const count = reactionCount(r.type);
          const isSaving = saving === r.type;

          return (
            <TouchableOpacity
              key={r.type}
              style={[styles.reactionBtn, active && styles.reactionBtnActive]}
              onPress={() => toggleReaction(r.type, r.emoji)}
              disabled={!!saving}
              activeOpacity={0.75}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              )}
              <Text style={[styles.reactionLabel, active && styles.reactionLabelActive]}>
                {r.label}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                  <Text style={[styles.countText, active && styles.countTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  empty: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  chaptersScroll: {
    gap: Spacing.sm,
    paddingHorizontal: 2,
  },
  chapterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chapterChipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  chapterChipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  chapterChipTextActive: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 60,
  },
  reactionBtnActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  reactionLabelActive: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  countBadge: {
    backgroundColor: Colors.surfaceBorder,
    borderRadius: Radii.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeActive: {
    backgroundColor: Colors.accent,
  },
  countText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  countTextActive: {
    color: '#fff',
  },
});
