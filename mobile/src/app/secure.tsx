import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput } from '../components/Text';
import { Benefits, Btn, IconBtn, Small, s } from '../components/ui';
import { invalidate } from '../lib/query';
import type { User } from '../lib/types';
import { api } from '../services/api';
import { toast, toastError, useApp } from '../store';
import { C, T, shadow } from '../theme';

/** Amankan akun tamu dengan nama pengguna + kata sandi (atau ganti kata sandi). */
export default function Secure() {
  const { user, setUser } = useApp();
  const secured = !!user?.secured;
  const [handle, setHandle] = useState(user?.handle ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [current, setCurrent] = useState('');
  const [busy, setBusy] = useState(false);
  const h = handle.trim().toLowerCase();
  const handleOk = /^[a-z0-9_.]{3,20}$/.test(h);
  const ok = handleOk && password.length >= 8 && password === confirm && (!secured || current.length >= 8);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  const save = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ user: User }>('/api/auth/secure', { handle: h, password, current: secured ? current : undefined });
      setUser(r.user);
      invalidate('/api/me');
      toast(secured ? 'Kata sandi diperbarui' : 'Akun aman! Kamu bisa masuk dari perangkat lain.');
      back();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const field = [s.field, { height: 52, borderColor: 'transparent', ...shadow(1) }];

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 18, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
          <IconBtn name="back" label="Kembali" onPress={back} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 30 }}>🔐</Text>
          <Text style={{ ...T.h1, fontSize: 28, lineHeight: 34, color: C.ink, marginTop: 6 }}>{secured ? 'Ganti kata sandi' : 'Amankan akunmu'}</Text>
          {!secured && (
            <Benefits
              items={[
                ['Masuk dari HP atau browser lain', 'Postingan, check-in, dan rencanamu ikut terbawa'],
                ['Tidak hilang saat ganti HP', 'Akun tamu hanya tersimpan di perangkat ini'],
              ]}
            />
          )}

          <Text style={s.label}>Nama pengguna</Text>
          <TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} placeholder="misalnya rani.sehat" style={field} accessibilityLabel="Nama pengguna" textContentType="username" />
          <Small style={{ marginTop: 6, color: handle && !handleOk ? C.red : C.muted }}>3–20 karakter: huruf kecil, angka, titik, atau garis bawah.</Small>

          {secured && (
            <>
              <Text style={s.label}>Kata sandi lama</Text>
              <TextInput value={current} onChangeText={setCurrent} secureTextEntry style={field} accessibilityLabel="Kata sandi lama" textContentType="password" />
            </>
          )}
          <Text style={s.label}>{secured ? 'Kata sandi baru' : 'Kata sandi'}</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimal 8 karakter" style={field} accessibilityLabel="Kata sandi baru" textContentType="newPassword" />
          <Text style={s.label}>Ulangi kata sandi</Text>
          <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry style={field} accessibilityLabel="Ulangi kata sandi" textContentType="newPassword" />
          {!!confirm && confirm !== password && <Small style={{ marginTop: 6, color: C.red }}>Kata sandi belum sama.</Small>}

          <View style={{ flex: 1, minHeight: 24 }} />
          <Btn title={secured ? 'Simpan kata sandi baru' : 'Amankan akun'} disabled={!ok} loading={busy} onPress={save} />
          <Small style={{ textAlign: 'center', marginTop: 10 }}>Kata sandi disimpan terenkripsi (hash), tim CalMates tidak bisa melihatnya.</Small>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
