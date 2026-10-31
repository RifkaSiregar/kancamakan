import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput } from '../../components/Text';
import { Btn, IconBtn, Small, s } from '../../components/ui';
import { clearCache } from '../../lib/query';
import type { User } from '../../lib/types';
import { api } from '../../services/api';
import { registerPushToken } from '../../services/notify';
import { toast, toastError, useApp } from '../../store';
import { C, T, shadow } from '../../theme';

/** Masuk ke akun yang sudah diamankan (nama pengguna + kata sandi) dari perangkat lain. */
export default function Login() {
  const setSession = useApp((st) => st.setSession);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = handle.trim().length >= 3 && password.length >= 8;

  const go = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ token: string; user: User }>('/api/auth/login', { handle: handle.trim(), password });
      clearCache();
      setSession(r.token, r.user);
      registerPushToken();
      router.dismissAll();
      router.replace('/home');
      toast(`Selamat datang kembali, ${r.user.name}!`);
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 18, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
          <IconBtn name="back" label="Kembali" onPress={() => router.back()} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 30 }}>👋</Text>
          <Text style={{ ...T.h1, fontSize: 28, lineHeight: 34, color: C.ink, marginTop: 6 }}>Masuk ke akunmu</Text>
          <Text style={{ ...T.body, color: C.muted, marginTop: 6 }}>Pakai nama pengguna dan kata sandi yang kamu buat di menu Profil → Amankan akun.</Text>

          <Text style={s.label}>Nama pengguna</Text>
          <TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} placeholder="misalnya rani.sehat" style={[s.field, { height: 52, borderColor: 'transparent', ...shadow(1) }]} accessibilityLabel="Nama pengguna" textContentType="username" />
          <Text style={s.label}>Kata sandi</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimal 8 karakter" style={[s.field, { height: 52, borderColor: 'transparent', ...shadow(1) }]} accessibilityLabel="Kata sandi" textContentType="password" onSubmitEditing={() => ok && go()} />

          <View style={{ flex: 1, minHeight: 24 }} />
          <Btn title="Masuk" disabled={!ok} loading={busy} onPress={go} />
          <Small style={{ textAlign: 'center', marginTop: 10 }}>Belum pernah mengamankan akun? Akun tamu hanya tersimpan di perangkat tempat kamu mendaftar.</Small>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
