import React, { useState } from 'react';
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { useAuthStore, AppUser } from '../../stores/authStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const INTEREST_OPTIONS = [
  'Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Romance',
  'Mystery', 'Thriller', 'Self-Help', 'History', 'Biography',
  'Philosophy', 'Poetry', 'Horror', 'Humor', 'Young Adult',
];

export function EditProfileModal({ visible, onClose }: Props) {
  const { appUser, session, updateProfile, fetchAppUser } = useAuthStore();
  const [bio, setBio] = useState(appUser?.bio ?? '');
  const [interests, setInterests] = useState<string[]>(appUser?.interests ?? []);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible && appUser) {
      setBio(appUser.bio ?? '');
      setInterests(appUser.interests ?? []);
      setAvatarUri(null);
      setAvatarBase64(null);
    }
  }, [visible, appUser]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
          ? [...prev, interest]
          : prev
    );
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarBase64(result.assets[0].base64 ?? null);
    }
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);

    try {
      let newAvatarUrl: string | undefined = undefined;

      // Upload avatar if changed
      if (avatarBase64) {
        const fileName = `${session.user.id}/avatar_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(avatarBase64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          // Try feed_images bucket as fallback
          const { error: fallbackError } = await supabase.storage
            .from('feed_images')
            .upload(fileName, decode(avatarBase64), {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (fallbackError) {
            Alert.alert('Upload Error', fallbackError.message);
            setSaving(false);
            return;
          }

          const { data: publicData } = supabase.storage
            .from('feed_images')
            .getPublicUrl(fileName);
          newAvatarUrl = publicData.publicUrl;
        } else {
          const { data: publicData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          newAvatarUrl = publicData.publicUrl;
        }
      }

      const updates: any = {
        bio: bio.trim(),
        interests,
      };
      if (newAvatarUrl) updates.avatar_url = newAvatarUrl;

      await updateProfile(updates);

      setSaving(false);
      onClose();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || String(e));
    }
  }

  const initials = (appUser?.username ?? '??').slice(0, 2).toUpperCase();
  const displayAvatar = avatarUri || appUser?.avatar_url;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar} activeOpacity={0.7}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bio</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={160}
              value={bio}
              onChangeText={setBio}
            />
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Reading Interests (pick up to 5)</Text>
            <View style={styles.interestsGrid}>
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    style={[styles.interestChip, isSelected && styles.interestChipActive]}
                    onPress={() => toggleInterest(interest)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.interestText, isSelected && styles.interestTextActive]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
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
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  saveText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  avatarOverlay: {
    position: 'absolute',
    top: 66,
    right: '50%',
    marginRight: -44,
    backgroundColor: Colors.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  changePhotoText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bioInput: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radii.md,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  interestChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  interestChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  interestText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  interestTextActive: {
    color: '#fff',
  },
});
