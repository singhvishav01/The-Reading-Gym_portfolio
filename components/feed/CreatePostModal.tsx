import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPostSuccess: () => void;
}

interface TrackedBook {
  book_id: string;
  current_chapter: number;
  status: string;
  books: {
    title: string;
    cover_url: string;
    author: string;
  };
}

export function CreatePostModal({ visible, onClose, onPostSuccess }: Props) {
  const { session } = useAuthStore();
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(null);
  const [trackedBooks, setTrackedBooks] = useState<TrackedBook[]>([]);
  const [milestoneType, setMilestoneType] = useState<string | null>(null);
  const [milestoneText, setMilestoneText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && session) {
      loadTrackedBooks();
    } else {
      // Reset state on close
      setCaption('');
      setImageUri(null);
      setImageBase64(null);
      setSelectedBookIndex(null);
      setMilestoneType(null);
      setMilestoneText(null);
    }
  }, [visible, session]);

  async function loadTrackedBooks() {
    if (!session) return;
    const { data, error } = await supabase
      .from('reading_progress')
      .select('book_id, current_chapter, status, books(title, cover_url, author)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setTrackedBooks(data as any);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access in your device settings to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function handleSubmit() {
    if (!session) {
      Alert.alert('Auth Error', 'You must be logged in to post.');
      return;
    }

    // Must have at least a caption or an image
    if (!caption.trim() && !imageBase64) {
      Alert.alert('Empty Post', 'Write something or add a photo!');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl: string | undefined = undefined;

      // Upload custom image if provided
      if (imageBase64) {
        const fileName = `${session.user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('feed_images')
          .upload(fileName, decode(imageBase64), { contentType: 'image/jpeg' });

        if (uploadError) {
          Alert.alert('Upload Error', uploadError.message);
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('feed_images')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // Book is now optional
      const selectedBook = selectedBookIndex !== null ? trackedBooks[selectedBookIndex] : null;
      const bookTitle = selectedBook?.books?.title || null;
      const bookCover = selectedBook?.books?.cover_url || null;
      const bookId = selectedBook?.book_id || null;

      // Insert feed event
      const { error } = await supabase.from('feed_events').insert({
        user_id: session.user.id,
        event_type: 'user_post',
        book_id: bookId,
        metadata: {
          caption: caption.trim(),
          book_title: bookTitle,
          book_cover: bookCover,
          image_url: finalImageUrl,
          milestone_type: milestoneType,
          milestone_text: milestoneText,
        },
      });

      setLoading(false);

      if (error) {
        Alert.alert('Failed to post', error.message);
      } else {
        onPostSuccess();
        onClose();
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('System Error', e.message || String(e));
    }
  }

  const selectedBook = selectedBookIndex !== null ? trackedBooks[selectedBookIndex] : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={loading} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Post</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.headerBtn}>
            {loading ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text style={styles.postText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {/* Caption Input */}
            <TextInput
              style={styles.captionInput}
              placeholder="Share a quote, thought, or update..."
              placeholderTextColor={Colors.textMuted}
              multiline
              autoFocus
              maxLength={500}
              value={caption}
              onChangeText={setCaption}
            />

            {/* Milestone Chips (only if a book is selected) */}
            {selectedBook && (
              <View style={styles.chipsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedBook.current_chapter === 0 && (
                    <TouchableOpacity
                      style={[styles.chip, milestoneType === 'started' && styles.chipActive]}
                      onPress={() => { setMilestoneType('started'); setMilestoneText('Just started reading!'); }}
                    >
                      <Text style={[styles.chipText, milestoneType === 'started' && styles.chipTextActive]}>📖 Just Started</Text>
                    </TouchableOpacity>
                  )}
                  {selectedBook.current_chapter > 0 && (
                    <TouchableOpacity
                      style={[styles.chip, milestoneType === 'chapter' && styles.chipActive]}
                      onPress={() => { setMilestoneType('chapter'); setMilestoneText(`Reached Chapter ${selectedBook.current_chapter}`); }}
                    >
                      <Text style={[styles.chipText, milestoneType === 'chapter' && styles.chipTextActive]}>🔖 Chapter {selectedBook.current_chapter}</Text>
                    </TouchableOpacity>
                  )}
                  {selectedBook.status === 'completed' && (
                    <TouchableOpacity
                      style={[styles.chip, milestoneType === 'completed' && styles.chipActive]}
                      onPress={() => { setMilestoneType('completed'); setMilestoneText('Finished this masterpiece!'); }}
                    >
                      <Text style={[styles.chipText, milestoneType === 'completed' && styles.chipTextActive]}>🏆 Finished</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.chip, !milestoneType && styles.chipActive]}
                    onPress={() => { setMilestoneType(null); setMilestoneText(null); }}
                  >
                    <Text style={[styles.chipText, !milestoneType && styles.chipTextActive]}>📝 Note</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Photo */}
            <View style={styles.mediaSection}>
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setImageUri(null); setImageBase64(null); }}>
                    <Ionicons name="close-circle" size={28} color={Colors.surface} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadRow}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto} activeOpacity={0.7}>
                    <Ionicons name="camera" size={28} color={Colors.accent} />
                    <Text style={styles.uploadBtnText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.7}>
                    <Ionicons name="image" size={28} color={Colors.accentLight} />
                    <Text style={[styles.uploadBtnText, { color: Colors.accentLight }]}>Library</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Book Selector (optional) */}
            {trackedBooks.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Tag a Book (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bookSelector}>
                  <TouchableOpacity
                    style={[styles.bookPill, selectedBookIndex === null && styles.bookPillSelected]}
                    onPress={() => { setSelectedBookIndex(null); setMilestoneType(null); setMilestoneText(null); }}
                  >
                    <Text style={[styles.pillTitle, selectedBookIndex === null && { color: Colors.surface }]}>
                      No Book
                    </Text>
                  </TouchableOpacity>
                  {trackedBooks.map((item, idx) => {
                    const isSelected = selectedBookIndex === idx;
                    return (
                      <TouchableOpacity
                        key={item.book_id}
                        style={[styles.bookPill, isSelected && styles.bookPillSelected]}
                        onPress={() => setSelectedBookIndex(idx)}
                      >
                        {item.books.cover_url && (
                          <Image source={{ uri: item.books.cover_url }} style={styles.pillCover} />
                        )}
                        <Text style={[styles.pillTitle, isSelected && { color: Colors.surface }]} numberOfLines={1}>
                          {item.books.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  headerBtn: {
    width: 60,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  postText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  captionInput: {
    color: Colors.text,
    fontSize: FontSize.lg,
    lineHeight: 24,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipsRow: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  mediaSection: {
    alignItems: 'center',
  },
  uploadRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  uploadBtn: {
    flex: 1,
    aspectRatio: 1.6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  uploadBtnText: {
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  bookSelector: {
    flexDirection: 'row',
    marginTop: -Spacing.sm,
  },
  bookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    paddingRight: Spacing.md,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    maxWidth: 200,
  },
  bookPillSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  pillCover: {
    width: 24,
    height: 32,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  pillTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
    flexShrink: 1,
  },
});
