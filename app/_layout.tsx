import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../lib/constants';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';

export default function RootLayout() {
  const { session, setSession, fetchAppUser, loading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAppUser(session.user.id);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAppUser(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return; // Wait until navigation tree is ready
    if (loading) return; // Wait for initial auth check

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      // Redirect away from auth screens to our tabs
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // Redirect to auth screens if not authenticated
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments, rootNavigationState?.key]);


  if (!fontsLoaded || loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="room/[bookId]" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
