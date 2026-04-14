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
  const [selectedBookIndex, setSelectedBookIndex] = useState<number>(0);
  const [trackedBooks, setTrackedBooks] = useState<TrackedBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && session) {
      loadTrackedBooks();
    } else {
      // Reset state on close
      setCaption('');
      setImageUri(null);
      setImageBase64(null);
      setSelectedBookIndex(0);
    }
  }, [visible, session]);

  async function loadTrackedBooks() {
    if (!session) return;
    const { data, error } = await supabase
      .from('reading_progress')
      .select('book_id, books(title, cover_url, author)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setTrackedBooks(data as any);
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
    if (!session) return;
    const book = trackedBooks[selectedBookIndex];
    if (!book) {
      Alert.alert('Error', 'Please select a book you are reading first.');
      return;
    }

    setLoading(true);

    let finalImageUrl: string | undefined = undefined;

    // Upload custom image if provided
    if (imageBase64) {
      const fileName = `${session.user.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
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

    // Insert feed event
    const { error } = await supabase.from('feed_events').insert({
      user_id: session.user.id,
      event_type: 'user_post',
      book_id: book.book_id,
      metadata: {
        caption: caption.trim(),
        book_title: book.books.title,
        book_cover: book.books.cover_url,
        image_url: finalImageUrl, // undefined if no custom photo uploaded
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Failed to post', error.message);
    } else {
      onPostSuccess();
      onClose();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={loading} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Post</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading || trackedBooks.length === 0} style={styles.headerBtn}>
            {loading ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text style={[styles.postText, trackedBooks.length === 0 && { color: Colors.textMuted }]}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            
            {trackedBooks.length === 0 ? (
              <View style={styles.emptyBooks}>
                <Text style={styles.emptyEmoji}>📚</Text>
                <Text style={styles.emptyText}>You need to track at least one book to make a post!</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Share a quote or thought..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  autoFocus
                  maxLength={500}
                  value={caption}
                  onChangeText={setCaption}
                />

                <View style={styles.mediaSection}>
                  {imageUri ? (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: imageUri }} style={styles.previewImage} />
                      <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setImageUri(null); setImageBase64(null); }}>
                        <Ionicons name="close-circle" size={28} color={Colors.surface} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.7}>
                      <Ionicons name="camera" size={32} color={Colors.accent} />
                      <Text style={styles.uploadBtnText}>Add a Photo</Text>
                      <Text style={styles.uploadBtnSub}>(or we'll just show the book's cover)</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.sectionLabel}>About Which Book?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bookSelector}>
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
  mediaSection: {
    alignItems: 'center',
  },
  uploadBtn: {
    width: '100%',
    aspectRatio: 1,
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
    fontWeight: 'bold',
    fontSize: FontSize.md,
  },
  uploadBtnSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
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
  emptyBooks: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
