import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password || !username) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (username.length < 3) {
      Alert.alert('Username too short', 'Username must be at least 3 characters.');
      return;
    }
    setLoading(true);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    setLoading(false);

    if (authError || !authData.user) {
      Alert.alert('Sign up failed', authError?.message ?? 'Unknown error');
      return;
    }

    Alert.alert(
      'Account created!',
      'Check your email to verify your account, then sign in.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.bg, Colors.surface]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.emoji}>🏋️</Text>
          <Text style={styles.title}>Join the Gym</Text>
          <Text style={styles.subtitle}>Start your reading journey today.</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create account</Text>
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="bookworm42"
            autoCapitalize="none"
            autoComplete="username"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
          />
          <Button
            label="Create Account"
            onPress={handleSignup}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.footerLink}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  footerLink: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
