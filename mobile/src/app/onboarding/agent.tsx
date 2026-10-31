import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Progress } from '../../components/Progress';
import { Btn, IconBtn, LinkBtn, Small, Tap, s } from '../../components/ui';
import { invalidate } from '../../lib/query';
import type { Plan, User } from '../../lib/types';
import { api } from '../../services/api';
import { toast, toastError, useApp } from '../../store';
import { C, shadow } from '../../theme';

const EXAMPLES: [string, string][] = [
  ['🏢', 'Kerja kantoran, sering makan di warteg, suka gorengan. Mau turun berat badan pelan-pelan.'],
  ['🎒', 'Mahasiswa anak kos, budget tipis, pengen makan lebih sehat.'],
  ['☕', 'Suka minum kopi susu dan teh manis tiap hari, mau mengurangi gula.'],
  ['👩‍🍳', 'Ibu rumah tangga, pengen masak menu sehat yang disukai anak-anak.'],
];

const STEPS = ['Memahami ceritamu…', 'Menyusun tantangan 7 hari…', 'Memilih ide menu…', 'Mencarikan bacaan & video…'];

/** Agent onboarding: pengguna cukup menulis satu kalimat, agent menyusun Rencana Sehatku. */
export default function Agent() {
  const { again } = useLocalSearchParams<{ again?: string }>();
  const { token, setSession, setUser } = useApp();
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const ok = input.trim().length >= 5 && (!!token || name.trim().length >= 2);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((x) => Math.min(x + 1, STEPS.length - 1)), 900);
    return () => clearInterval(t);
  }, [busy]);

  const go = async () => {
    setBusy(true);
    try {
      // Pengguna baru: buat akun dulu (nama panggilan saja).
      if (!useApp.getState().token) {
        const r = await api.post<{ token: string; user: User }>('/api/auth/guest', { name: name.trim() });
        setSession(r.token, r.user);
      }
      const r = await api.post<{ plan: Plan }>('/api/agent/plan', { input: input.trim() }, 60000);
      invalidate('/api/plan');
      const me = await api.get<{ user: User }>('/api/me');
      setUser(me.user);
      if (again) {
        router.replace('/plan');
        toast('Rencana baru siap');
      } else {
        router.push({ pathname: '/plan', params: { from: 'onboarding' } });
      }
    } catch (e) {
      toastError(e, 'Agent gagal menyusun rencana');
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <View style={st.orb}>
          <Icon name="spark" size={44} color="#fff" stroke={1.8} />
        </View>
        <Text style={{ marginTop: 22, fontSize: 20, fontWeight: '800', color: C.ink, textAlign: 'center' }}>Menyusun Rencana Sehatku</Text>
        <View style={{ marginTop: 16, gap: 10, alignSelf: 'stretch', maxWidth: 320, marginHorizontal: 'auto' }} accessibilityLiveRegion="polite">
          {STEPS.map((t, i) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: i <= step ? 1 : 0.35 }}>
              {i < step ? <Icon name="check" size={18} color={C.acc} stroke={3} /> : i === step ? <ActivityIndicator size="small" color={C.acc} /> : <View style={{ width: 18 }} />}
              <Text style={{ fontSize: 14, color: C.ink, fontWeight: i === step ? '700' : '500' }}>{t}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 18, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
          <IconBtn name={again ? 'close' : 'back'} label={again ? 'Tutup' : 'Kembali'} onPress={() => router.back()} style={{ marginBottom: 10 }} />
          {!again && <Progress step={2} total={3} />}
          <View style={st.badge}>
            <Icon name="spark" size={14} color={C.accDark} stroke={2} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.accDark }}>Agent AI</Text>
          </View>
          <Text style={{ marginTop: 10, fontSize: 28, lineHeight: 34, fontWeight: '800', color: C.ink, letterSpacing: -0.6 }}>Ceritakan dirimu dalam satu kalimat</Text>
          <Text style={{ marginTop: 6, marginBottom: 14, fontSize: 13.5, lineHeight: 20, color: C.muted }}>
            Agent menyusun rencana sehat yang pas untukmu: tantangan 7 hari, ide menu, dan bacaan pilihan. Tanpa hitung kalori.
          </Text>

          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={300}
            autoFocus={!again}
            placeholder="Contoh: kerja kantoran, sering makan di warteg, suka gorengan. Mau lebih sehat."
            style={[s.field, { minHeight: 120, fontSize: 15.5, lineHeight: 22, ...shadow(1), borderColor: 'transparent' }]}
            accessibilityLabel="Ceritakan dirimu"
          />
          <Small style={{ textAlign: 'right', marginTop: 4 }}>{input.length}/300</Small>

          <Text style={[s.label, { marginTop: 4 }]}>Atau pilih contoh</Text>
          <View style={{ gap: 8 }}>
            {EXAMPLES.map(([e, ex]) => (
              <Tap key={ex} accessibilityRole="button" onPress={() => setInput(ex)} style={[st.ex, input === ex && { borderColor: C.acc, backgroundColor: '#F4FBF7' }]} scale={0.98}>
                <View style={st.exIcon}>
                  <Text style={{ fontSize: 18 }}>{e}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 19, color: C.ink, fontWeight: '500' }}>{ex}</Text>
              </Tap>
            ))}
          </View>

          {!token && (
            <>
              <Text style={s.label}>Nama panggilan</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Misalnya Rani" maxLength={24} style={[s.field, { height: 48 }]} accessibilityLabel="Nama panggilan" />
              <Small style={{ marginTop: 4 }}>Ditampilkan di komunitas. Tidak perlu email atau kata sandi.</Small>
            </>
          )}

          <View style={{ flex: 1, minHeight: 16 }} />
          <Btn title="Buat Rencana Sehatku" icon="spark" disabled={!ok} onPress={go} style={{ marginTop: 12 }} />
          {!again && !token && <LinkBtn title="Pilih tujuan manual saja" muted onPress={() => router.push('/onboarding/goals')} />}
          <Small style={{ textAlign: 'center', marginBottom: 6 }}>Rencana berupa saran umum, bukan pengganti konsultasi medis.</Small>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  orb: { width: 104, height: 104, borderRadius: 52, backgroundColor: C.acc, alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: C.mint, ...shadow(3) },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ex: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, ...shadow(1) },
  exIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
});
