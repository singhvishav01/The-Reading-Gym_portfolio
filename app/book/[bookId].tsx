import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { getBook, type GoogleBook } from '../../lib/googleBooks';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { OpenAIQuizModal } from '../../components/room/OpenAIQuizModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reader {
  user_id: string;
  current_chapter: number;
  is_completed: boolean;
  status: string;
  users: { username: string; avatar_url: string | null };
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  users: { username: string; avatar_url: string | null };
}

type ShelfStatus = 'reading' | 'want_to_read' | 'completed' | null;

// ─── Small helpers ────────────────────────────────────────────────────────────

function StarRow({ rating, size = 16, color = Colors.gold }: { rating: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={rating >= n ? 'star' : rating >= n - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={color}
        />
      ))}
    </View>
  );
}

function Avatar({ url, username, size = 32 }: { url?: string | null; username: string; size?: number }) {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.accentDim,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.accent + '40',
      }}
    >
      <Text style={{ color: Colors.accent, fontSize: size * 0.38, fontWeight: '700' }}>
        {username.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

interface ReviewModalProps {
  visible: boolean;
  bookTitle: string;
  initialRating?: number;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => Promise<void>;
}

function ReviewModal({ visible, bookTitle, initialRating = 0, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [text, setText]     = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRating(initialRating);
      setText('');
    }
  }, [visible]);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Rate the book', 'Please pick a star rating before submitting.');
      return;
    }
    setSaving(true);
    await onSubmit(rating, text);
    setSaving(false);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={rvStyles.root}>
        <View style={rvStyles.header}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text style={rvStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={rvStyles.title}>Your Review</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={saving || rating === 0}>
            {saving ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text style={[rvStyles.submitText, rating === 0 && { opacity: 0.4 }]}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={rvStyles.content} keyboardShouldPersistTaps="handled">
            <Text style={rvStyles.bookName}>"{bookTitle}"</Text>

            {/* Star picker */}
            <View style={rvStyles.starPicker}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                  <Ionicons
                    name={rating >= n ? 'star' : 'star-outline'}
                    size={40}
                    color={rating >= n ? Colors.gold : Colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={rvStyles.ratingLabel}>
              {rating === 0 ? 'Tap to rate' : ['', 'Didn\'t like it', 'It was ok', 'Liked it', 'Really liked it', 'It was amazing'][rating]}
            </Text>

            <TextInput
              style={rvStyles.textInput}
              placeholder="Share your thoughts (optional)..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={600}
              value={text}
              onChangeText={setText}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const rvStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  cancelText: { color: Colors.textSecondary, fontSize: FontSize.md },
  title:      { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  submitText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  content: { padding: Spacing.lg, gap: Spacing.lg, alignItems: 'center' },
  bookName: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', fontStyle: 'italic' },
  starPicker: { flexDirection: 'row', gap: Spacing.sm },
  ratingLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: -Spacing.xs },
  textInput: {
    width: '100%',
    minHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookDetailScreen() {
  const { bookId }             = useLocalSearchParams<{ bookId: string }>();
  const { session, appUser }   = useAuthStore();

  const [book, setBook]           = useState<GoogleBook | null>(null);
  const [readers, setReaders]     = useState<Reader[]>([]);
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [myShelf, setMyShelf]     = useState<ShelfStatus>(null);
  const [myReview, setMyReview]   = useState<Review | null>(null);
  const [loading, setLoading]     = useState(true);
  const [shelfSaving, setShelfSaving] = useState(false);

  const [quizVisible, setQuizVisible]   = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [descExpanded, setDescExpanded]   = useState(false);

  useEffect(() => {
    if (!bookId || !session) return;
    loadAll();
  }, [bookId, session]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadBook(), loadReaders(), loadReviews(), loadMyShelf()]);
    setLoading(false);
  }

  async function loadBook() {
    // Check local DB first (faster, already has cover etc.)
    const { data: cached } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .maybeSingle();

    // Always also fetch from API for richer data (publish year, rating, subjects)
    const apiBook = await getBook(bookId!);

    if (apiBook) {
      // Merge: prefer API data, fall back to DB cache
      setBook(apiBook);
      // Upsert into DB so reading rooms can reference it
      await supabase.from('books').upsert(
        {
          id: apiBook.id,
          title: apiBook.title,
          author: apiBook.author,
          cover_url: apiBook.cover,
          description: apiBook.description,
        },
        { onConflict: 'id' }
      );
    } else if (cached) {
      setBook({
        id: cached.id,
        title: cached.title,
        author: cached.author,
        cover: cached.cover_url ?? '',
        description: cached.description ?? '',
      });
    }
  }

  async function loadReaders() {
    const { data } = await supabase
      .from('reading_progress')
      .select('user_id, current_chapter, is_completed, status, users(username, avatar_url)')
      .eq('book_id', bookId)
      .order('current_chapter', { ascending: false });
    if (data) setReaders(data as any);
  }

  async function loadReviews() {
    const { data } = await supabase
      .from('book_reviews')
      .select('id, user_id, rating, review_text, created_at, users(username, avatar_url)')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });
    if (data) {
      setReviews(data as any);
      const mine = data.find((r: any) => r.user_id === session?.user.id);
      if (mine) setMyReview(mine as any);
    }
  }

  async function loadMyShelf() {
    if (!session) return;
    const { data } = await supabase
      .from('reading_progress')
      .select('status, is_completed')
      .eq('user_id', session.user.id)
      .eq('book_id', bookId)
      .maybeSingle();

    if (!data) {
      setMyShelf(null);
    } else if (data.is_completed || data.status === 'completed') {
      setMyShelf('completed');
    } else if (data.status === 'want_to_read') {
      setMyShelf('want_to_read');
    } else {
      setMyShelf('reading');
    }
  }

  async function handleAddToShelf(status: 'want_to_read' | 'reading') {
    if (!session) return;
    setShelfSaving(true);

    // Ensure room exists first
    const { data: roomData } = await supabase
      .from('reading_rooms')
      .select('id')
      .eq('book_id', bookId)
      .maybeSingle();

    let roomId = roomData?.id;
    if (!roomId) {
      const { data: newRoom } = await supabase
        .from('reading_rooms')
        .insert({ book_id: bookId })
        .select('id')
        .single();
      roomId = newRoom?.id;
    }

    if (!roomId) {
      Alert.alert('Error', 'Could not create reading room.');
      setShelfSaving(false);
      return;
    }

    await supabase.from('reading_progress').upsert(
      {
        user_id:         session.user.id,
        book_id:         bookId,
        room_id:         roomId,
        current_chapter: 0,
        status,
      },
      { onConflict: 'user_id,book_id' }
    );

    await supabase.from('feed_events').insert({
      user_id:    session.user.id,
      event_type: 'room_joined',
      book_id:    bookId,
      metadata:   { book_title: book?.title },
    });

    setMyShelf(status);
    setShelfSaving(false);
  }

  async function handleQuizPassed() {
    setQuizVisible(false);
    setReviewVisible(true);
  }

  async function handleReviewSubmit(rating: number, reviewText: string) {
    if (!session || !bookId) return;

    // 1. Save review
    await supabase.from('book_reviews').upsert(
      { user_id: session.user.id, book_id: bookId, rating, review_text: reviewText || null },
      { onConflict: 'user_id,book_id' }
    );

    // 2. Mark book as completed in reading_progress
    const { data: roomData } = await supabase
      .from('reading_rooms')
      .select('id')
      .eq('book_id', bookId)
      .maybeSingle();

    if (roomData?.id) {
      await supabase.from('reading_progress').upsert(
        {
          user_id:         session.user.id,
          book_id:         bookId,
          room_id:         roomData.id,
          current_chapter: 0,
          is_completed:    true,
          status:          'completed',
        },
        { onConflict: 'user_id,book_id' }
      );
    }

    // 3. Feed event
    await supabase.from('feed_events').insert({
      user_id:    session.user.id,
      event_type: 'book_completed',
      book_id:    bookId,
      metadata:   { book_title: book?.title },
    });

    setReviewVisible(false);
    setMyShelf('completed');
    await loadReviews();
    Alert.alert('Congratulations! 🎉', '+50 XP awarded for finishing the book!');
  }

  // Computed values
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  const finishedReaders = readers.filter((r) => r.is_completed || r.status === 'completed');
  const activeReaders   = readers.filter((r) => !r.is_completed && r.status !== 'completed' && r.status !== 'want_to_read');

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Book not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
            <Text style={{ color: Colors.accent }}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const desc = book.description ?? '';
  const descPreview = desc.length > 220 && !descExpanded ? desc.slice(0, 220) + '…' : desc;

  return (
    <SafeAreaView style={styles.root}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Text style={{ fontSize: 48 }}>📖</Text>
            </View>
          )}

          <View style={styles.heroMeta}>
            <Text style={styles.heroTitle} numberOfLines={3}>{book.title}</Text>
            <Text style={styles.heroAuthor}>{book.author}</Text>

            {/* Publish year + subjects */}
            <View style={styles.metaRow}>
              {book.publishYear && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{book.publishYear}</Text>
                </View>
              )}
              {book.subjects?.slice(0, 2).map((s) => (
                <View key={s} style={styles.metaChip}>
                  <Text style={styles.metaChipText} numberOfLines={1}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Ratings row */}
            <View style={styles.ratingsRow}>
              {book.olRating != null && (
                <View style={styles.ratingBlock}>
                  <StarRow rating={book.olRating} size={13} />
                  <Text style={styles.ratingLabel}>
                    {book.olRating} OL {book.olRatingCount != null ? `(${book.olRatingCount.toLocaleString()})` : ''}
                  </Text>
                </View>
              )}
              {avgRating != null && (
                <View style={styles.ratingBlock}>
                  <StarRow rating={avgRating} size={13} color={Colors.accent} />
                  <Text style={[styles.ratingLabel, { color: Colors.accent }]}>
                    {avgRating} here ({reviews.length})
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionsSection}>
          {/* Join Reading Room */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push(`/room/${bookId}`)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.xpGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Ionicons name="people" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Join Reading Room</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.shelfRow}>
            {/* Want to Read */}
            <TouchableOpacity
              style={[
                styles.shelfBtn,
                myShelf === 'want_to_read' && styles.shelfBtnActive,
              ]}
              onPress={() => myShelf !== 'want_to_read' && handleAddToShelf('want_to_read')}
              disabled={shelfSaving || myShelf === 'completed'}
              activeOpacity={0.7}
            >
              {shelfSaving ? (
                <ActivityIndicator color={Colors.gold} size="small" />
              ) : (
                <>
                  <Ionicons
                    name={myShelf === 'want_to_read' ? 'bookmark' : 'bookmark-outline'}
                    size={16}
                    color={myShelf === 'want_to_read' ? Colors.gold : Colors.textSecondary}
                  />
                  <Text style={[styles.shelfBtnText, myShelf === 'want_to_read' && { color: Colors.gold }]}>
                    {myShelf === 'want_to_read' ? 'On Wishlist' : 'Want to Read'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* I've Read This */}
            <TouchableOpacity
              style={[
                styles.shelfBtn,
                myShelf === 'completed' && styles.shelfBtnDone,
              ]}
              onPress={() => {
                if (myShelf === 'completed') {
                  // Already done — let them write/edit review
                  setReviewVisible(true);
                } else {
                  setQuizVisible(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={myShelf === 'completed' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={16}
                color={myShelf === 'completed' ? Colors.success : Colors.textSecondary}
              />
              <Text style={[styles.shelfBtnText, myShelf === 'completed' && { color: Colors.success }]}>
                {myShelf === 'completed' ? 'Read ✓' : "I've Read This"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Description ── */}
        {desc.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this book</Text>
            <Text style={styles.descText}>{descPreview}</Text>
            {desc.length > 220 && (
              <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} activeOpacity={0.7}>
                <Text style={styles.showMoreText}>
                  {descExpanded ? 'Show less' : 'Show more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Currently reading ── */}
        {activeReaders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Currently Reading · {activeReaders.length}
            </Text>
            {activeReaders.slice(0, 5).map((r) => (
              <View key={r.user_id} style={styles.readerRow}>
                <Avatar url={r.users.avatar_url} username={r.users.username} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.readerName}>{r.users.username}</Text>
                  <Text style={styles.readerChapter}>Chapter {r.current_chapter}</Text>
                </View>
                <View style={styles.chapterBadge}>
                  <Text style={styles.chapterBadgeText}>Ch.{r.current_chapter}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Finished readers ── */}
        {finishedReaders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Finished · {finishedReaders.length}</Text>
            <View style={styles.finishedAvatarRow}>
              {finishedReaders.slice(0, 8).map((r) => (
                <View key={r.user_id} style={styles.finishedReader}>
                  <Avatar url={r.users.avatar_url} username={r.users.username} size={36} />
                  <Text style={styles.finishedName} numberOfLines={1}>{r.users.username}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Reviews ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reviews {reviews.length > 0 ? `· ${reviews.length}` : ''}
          </Text>

          {reviews.length === 0 ? (
            <Text style={styles.emptyReviews}>
              No reviews yet. Finish the book to be the first!
            </Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Avatar url={rev.users.avatar_url} username={rev.users.username} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUsername}>{rev.users.username}</Text>
                    <Text style={styles.reviewDate}>{timeAgo(rev.created_at)}</Text>
                  </View>
                  <StarRow rating={rev.rating} size={14} />
                </View>
                {rev.review_text ? (
                  <Text style={styles.reviewText}>{rev.review_text}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Quiz modal */}
      {book && (
        <OpenAIQuizModal
          visible={quizVisible}
          bookTitle={book.title}
          bookAuthor={book.author}
          onClose={() => setQuizVisible(false)}
          onSuccess={handleQuizPassed}
        />
      )}

      {/* Review modal */}
      <ReviewModal
        visible={reviewVisible}
        bookTitle={book?.title ?? ''}
        initialRating={myReview?.rating ?? 0}
        onClose={() => setReviewVisible(false)}
        onSubmit={handleReviewSubmit}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.textMuted, fontSize: FontSize.md },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: Spacing.sm,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface + 'cc',
    borderRadius: 20,
  },
  scroll: { paddingTop: Spacing.xl },

  // ── Hero ──
  hero: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    paddingTop: Spacing.xl + Spacing.sm,
    alignItems: 'flex-start',
  },
  cover: {
    width: 110,
    height: 160,
    borderRadius: Radii.md,
    flexShrink: 0,
  },
  coverFallback: {
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: { flex: 1, gap: Spacing.xs },
  heroTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 26,
  },
  heroAuthor: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: Spacing.xs },
  metaChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    maxWidth: 120,
  },
  metaChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  ratingsRow: { flexDirection: 'column', gap: 4, marginTop: Spacing.xs },
  ratingBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingLabel: { color: Colors.textMuted, fontSize: FontSize.xs },

  // ── Actions ──
  actionsSection: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  primaryBtn: { borderRadius: Radii.md, overflow: 'hidden' },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  shelfRow: { flexDirection: 'row', gap: Spacing.sm },
  shelfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  shelfBtnActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
  },
  shelfBtnDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.successDim,
  },
  shelfBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // ── Sections ──
  section: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // Description
  descText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  showMoreText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Reader rows
  readerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  readerName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  readerChapter: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  chapterBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  chapterBadgeText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },

  // Finished row
  finishedAvatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  finishedReader: {
    alignItems: 'center',
    gap: 4,
    width: 44,
  },
  finishedName: {
    color: Colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },

  // Reviews
  emptyReviews: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reviewUsername: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  reviewDate: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  reviewText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
});
