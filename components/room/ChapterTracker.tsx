import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radii, FontSize, FontWeight, Spacing } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';

interface ChapterTrackerProps {
  roomId: string;
  bookId: string;
}

export function ChapterTracker({ roomId, bookId }: ChapterTrackerProps) {
  const [saving, setSaving] = React.useState(false);
  const { session } = useAuthStore();
  const { myProgress, setMyProgress } = useRoomStore();

  const chapter = myProgress?.current_chapter ?? 0;

  async function updateChapter(newChapter: number) {
    if (!session || newChapter < 0) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { data, error } = await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: session.user.id,
          room_id: roomId,
          book_id: bookId,
          current_chapter: newChapter,
        },
        { onConflict: 'user_id,book_id' }
      )
      .select()
      .single();

    if (!error && data) {
      setMyProgress({ ...data, users: myProgress?.users ?? { username: '', avatar_url: null } });

      // Log feed event
      await supabase.from('feed_events').insert({
        user_id: session.user.id,
        event_type: 'chapter_progress',
        book_id: bookId,
        metadata: {
          chapter_number: newChapter,
          room_id: roomId,
          book_title: useRoomStore.getState().book?.title,
        },
      });
    }
    setSaving(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Progress</Text>
      <View style={styles.tracker}>
        <TouchableOpacity
          style={[styles.btn, chapter === 0 && styles.btnDisabled]}
          onPress={() => updateChapter(chapter - 1)}
          disabled={chapter === 0 || saving}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>

        <View style={styles.chapterDisplay}>
          {saving ? (
            <ActivityIndicator color={Colors.accent} size="small" />
          ) : (
            <>
              <Text style={styles.chapterNum}>{chapter}</Text>
              <Text style={styles.chapterSub}>chapter</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => updateChapter(chapter + 1)}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
      {chapter > 0 && (
        <Text style={styles.xpHint}>+10 XP per chapter 🔥</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tracker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  btnText: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: FontWeight.bold,
    lineHeight: 26,
  },
  chapterDisplay: {
    alignItems: 'center',
    minWidth: 60,
    minHeight: 52,
    justifyContent: 'center',
  },
  chapterNum: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 36,
  },
  chapterSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  xpHint: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
