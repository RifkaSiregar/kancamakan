import { router, useSegments } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toast } from '../components/Toast';
import * as Notifications from 'expo-notifications';
import { setUnauthorizedHandler } from '../services/api';
import { notificationsSupported } from '../services/notify';
import { toast, useApp } from '../store';
import { C } from '../theme';

export default function RootLayout() {
  const storeReady = useApp((s) => s.hydrated);
  const [fontsLoaded, fontError] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  const hydrated = storeReady && (fontsLoaded || !!fontError);
  const token = useApp((s) => s.token);
  const segments = useSegments();

  // Penjaga rute: tanpa akun, semua layar selain onboarding diarahkan ke onboarding
  // (misalnya saat browser membuka ulang alamat lama atau sesi dihapus).
  useEffect(() => {
    if (!hydrated) return;
    const inOnboarding = segments[0] === 'onboarding';
    const isRoot = (segments as string[]).length === 0;
    if (!token && !inOnboarding && !isRoot) router.replace('/onboarding');
  }, [hydrated, token, segments]);

  // Token tidak berlaku lagi (misalnya database direset) → kembali ke onboarding.
  useEffect(() => {
    setUnauthorizedHandler((message) => {
      if (!useApp.getState().token) return;
      useApp.getState().logout();
      toast(message && /dinonaktifkan/.test(message) ? message : 'Sesi berakhir. Silakan masuk lagi.');
      router.replace('/onboarding');
    });
  }, []);

  // Ketuk notifikasi (pengingat / push) → buka layar terkait.
  useEffect(() => {
    if (!notificationsSupported) return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const d = r.notification.request.content.data as { url?: string; postId?: number } | undefined;
      if (d?.postId) router.push({ pathname: '/post/[id]', params: { id: String(d.postId) } });
      else if (d?.url) router.push(d.url as never);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {hydrated ? (
        <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#DCEDE3' : C.bg }}>
          {/* Di web layar lebar, aplikasi ditampilkan selebar ponsel di tengah layar. */}
          <View style={Platform.OS === 'web' ? { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.bg } : { flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
            <Stack.Screen name="demo" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="waitlist" options={{ gestureEnabled: false }} />
          </Stack>
          <Toast />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
          <ActivityIndicator color={C.acc} />
        </View>
      )}
    </SafeAreaProvider>
  );
}
