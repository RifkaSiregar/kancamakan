import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, TextInput } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Progress } from '../../components/Progress';
import { Btn, Chip, IconBtn, RadioRow, Small, s } from '../../components/ui';
import { GOALS, TOPICS } from '../../data/sample';
import type { User } from '../../lib/types';
import { api } from '../../services/api';
import { toastError, useApp } from '../../store';
import { C } from '../../theme';

/** Jalur manual: pilih tujuan & topik sendiri, lalu buat akun. */
export default function Goals() {
  const setSession = useApp((st) => st.setSession);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(GOALS[2][0]);
  const [topics, setTopics] = useState<string[]>(['Meal prep']);
  const [busy, setBusy] = useState(false);
  const ok = topics.length > 0 && name.trim().length >= 2;
  const toggle = (t: string) => setTopics((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  const enter = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ token: string; user: User }>('/api/auth/guest', { name: name.trim(), goal, topics });
      setSession(r.token, r.user);
      router.dismissAll();
      router.replace('/home');
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 18, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
        <IconBtn name="back" label="Kembali" onPress={() => router.back()} style={{ marginBottom: 10 }} />
        <Progress step={2} total={2} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: C.ink }}>Apa tujuanmu sekarang?</Text>
        <Text style={{ marginTop: 6, marginBottom: 14, fontSize: 13.5, color: C.muted }}>Beranda disusun sesuai pilihanmu. Bisa diubah kapan saja.</Text>

        <Text style={[s.label, { marginTop: 0 }]}>Nama panggilan</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Misalnya Rani" maxLength={24} style={[s.field, { height: 48, marginBottom: 12 }]} accessibilityLabel="Nama panggilan" />

        <View accessibilityRole="radiogroup" accessibilityLabel="Tujuan" style={{ gap: 8 }}>
          {GOALS.map(([g, sub]) => (
            <RadioRow key={g} on={goal === g} onPress={() => setGoal(g)} title={g} sub={sub} />
          ))}
        </View>

        <Text style={{ marginTop: 18, marginBottom: 2, fontSize: 15, fontWeight: '700', color: C.ink }}>Topik yang kamu minati</Text>
        <Small style={{ marginBottom: 8 }}>Pilih minimal satu</Small>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TOPICS.map((t) => (
            <Chip key={t} label={t} on={topics.includes(t)} onPress={() => toggle(t)} />
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />
        <Btn title="Masuk ke komunitas" disabled={!ok} loading={busy} onPress={enter} />
        <Small style={{ textAlign: 'center', marginTop: 8, marginBottom: 6 }}>
          {ok ? 'Dengan melanjutkan, kamu menyetujui aturan komunitas.' : 'Isi nama panggilan dan pilih minimal satu topik.'}
        </Small>
      </ScrollView>
    </SafeAreaView>
  );
}
