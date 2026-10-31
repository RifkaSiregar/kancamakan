import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sheet } from '../../components/Sheet';
import { Icon, IconName } from '../../components/Icon';
import { Avatar, Btn, Card, Chip, Grad, Pill, RadioRow, Small, Tap, s } from '../../components/ui';
import { GOALS, TOPICS } from '../../data/sample';
import { invalidate, useQuery } from '../../lib/query';
import type { Plan, User } from '../../lib/types';
import { api } from '../../services/api';
import { setDailyReminder, registerPushToken } from '../../services/notify';
import { toast, toastError, useApp } from '../../store';
import { C, R, T, TOPIC_EMOJI, shadow } from '../../theme';

function confirm(title: string, body: string, ok: string, run: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${body}`)) run();
    return;
  }
  Alert.alert(title, body, [
    { text: 'Batal', style: 'cancel' },
    { text: ok, style: 'destructive', onPress: run },
  ]);
}

export default function Profile() {
  const { user, setUser, logout, reminder, setReminder } = useApp();
  const me = useQuery<{ user: User; stats: { posts: number; saved: number; checkins: number } }>('/api/me');
  const plan = useQuery<{ plan: Plan | null }>('/api/plan');
  const premium = useQuery<{ interested: boolean; count: number }>('/api/premium');
  const [edit, setEdit] = useState(false);
  const u = me.data?.user ?? user;
  const [name, setName] = useState(u?.name ?? '');
  const [goal, setGoal] = useState(u?.goal ?? GOALS[2][0]);
  const [topics, setTopics] = useState<string[]>(u?.topics ?? []);
  const [saving, setSaving] = useState(false);
  const ins = useSafeAreaInsets();

  const openEdit = () => {
    setName(u?.name ?? '');
    setGoal(u?.goal ?? GOALS[2][0]);
    setTopics(u?.topics ?? []);
    setEdit(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.patch<{ user: User }>('/api/me', { name: name.trim(), goal, topics });
      setUser(r.user);
      invalidate('/api/me');
      setEdit(false);
      toast('Profil diperbarui');
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
    }
  };

  const secured = !!u?.secured;
  const signOut = () =>
    confirm(
      'Keluar dari akun?',
      secured ? `Kamu bisa masuk lagi kapan saja dengan nama pengguna @${u?.handle}.` : 'Akunmu belum diamankan. Setelah keluar, kamu tidak bisa masuk lagi ke akun ini. Amankan akun dulu agar datamu tidak hilang.',
      'Keluar',
      async () => {
        await api.post('/api/auth/logout').catch(() => {});
        logout();
        router.replace('/onboarding');
      },
    );

  const applyReminder = async (on: boolean, hour: number) => {
    const r = await setDailyReminder(on, hour);
    if (r === 'unsupported') return toast('Pengingat hanya tersedia di aplikasi HP (Expo Go / Android / iOS).');
    if (r === 'denied') return toast('Izin notifikasi ditolak. Aktifkan lewat pengaturan HP.');
    setReminder({ on, hour });
    if (on) registerPushToken();
    toast(on ? `Pengingat check-in tiap pukul ${String(hour).padStart(2, '0')}.00` : 'Pengingat dimatikan');
  };

  const deleteAccount = () =>
    confirm('Hapus akun?', 'Semua postingan, tanggapan, check-in, dan rencanamu akan dihapus permanen dari server.', 'Hapus akun', async () => {
      try {
        await api.del('/api/me');
        logout();
        router.replace('/onboarding');
        toast('Akun dihapus');
      } catch (e) {
        toastError(e);
      }
    });

  const stats = me.data?.stats;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Grad from="#178A60" to="#0B5139" style={[st.hero, { paddingTop: ins.top + 16 }]}>
          <View style={st.blob} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={st.avRing}>
              <Avatar ini={u?.initials ?? '?'} tone="green" size={64} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>{u?.name ?? 'Kamu'}</Text>
              {u?.handle ? <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', fontWeight: '700', marginTop: 1 }}>@{u.handle}</Text> : null}
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 }}>🎯 {u?.goal}</Text>
            </View>
            <Tap accessibilityRole="button" accessibilityLabel="Ubah profil" onPress={openEdit} style={st.edit} scale={0.92}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: C.ink }}>Ubah</Text>
            </Tap>
          </View>
          {u && u.topics.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              {u.topics.map((t) => (
                <Pill key={t} label={t} tone="light" emoji={TOPIC_EMOJI[t]} />
              ))}
            </View>
          )}
        </Grad>

        <View style={{ paddingHorizontal: 18, marginTop: -28, gap: 14 }}>
          <View style={st.stats}>
            {(
              [
                ['Postingan', stats?.posts, '/my?type=mine', '📝'],
                ['Tersimpan', stats?.saved, '/my?type=saved', '🔖'],
                ['Check-in', stats?.checkins, '/challenges', '🔥'],
              ] as const
            ).map(([l, n, href, e], i) => (
              <Tap key={l} accessibilityRole="button" accessibilityLabel={`${l}: ${n ?? 0}`} onPress={() => router.push(href)} style={[st.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: C.lineSoft }]}>
                <Text style={{ fontSize: 15 }}>{e}</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink }}>{n ?? '–'}</Text>
                <Small>{l}</Small>
              </Tap>
            ))}
          </View>

          {!secured && u && (
            <Tap accessibilityRole="button" accessibilityLabel="Amankan akun" onPress={() => router.push('/secure')} style={st.secure} scale={0.98}>
              <Text style={{ fontSize: 30 }}>🔐</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '800', color: C.ink }}>Amankan akunmu</Text>
                <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18, marginTop: 2 }}>Buat nama pengguna & kata sandi agar bisa masuk dari perangkat lain.</Text>
              </View>
              <Icon name="chev" size={16} color={C.acc} stroke={2.4} />
            </Tap>
          )}

          <Card style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bell" size={18} color={C.acc} stroke={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.ink }}>Pengingat check-in harian</Text>
                <Small>{reminder.on ? `Aktif · pukul ${String(reminder.hour).padStart(2, '0')}.00` : 'Biar tantangan mingguan tidak terlewat'}</Small>
              </View>
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: reminder.on }} accessibilityLabel="Pengingat check-in harian" onPress={() => applyReminder(!reminder.on, reminder.hour)} style={[st.sw, reminder.on && { backgroundColor: C.acc }]}>
                <View style={[st.knob, reminder.on && { transform: [{ translateX: 20 }] }]} />
              </Pressable>
            </View>
            {reminder.on && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {[7, 12, 19].map((h) => (
                  <Chip key={h} label={`${String(h).padStart(2, '0')}.00`} on={reminder.hour === h} onPress={() => applyReminder(true, h)} />
                ))}
              </View>
            )}
          </Card>

          <Card style={{ overflow: 'hidden' }}>
            <Row icon="spark" label={plan.data?.plan ? 'Rencana Sehatku' : 'Buat Rencana Sehatku'} sub={plan.data?.plan ? plan.data.plan.challenge.title : 'Agent AI menyusun rencana dari ceritamu'} onPress={() => (plan.data?.plan ? router.push('/plan') : router.push({ pathname: '/onboarding/agent', params: { again: '1' } }))} />
            {plan.data?.plan && <Row icon="flag" label="Buat ulang rencana" border onPress={() => router.push({ pathname: '/onboarding/agent', params: { again: '1' } })} />}
          </Card>

          <Tap accessibilityRole="button" accessibilityLabel="Lihat demo Premium" onPress={() => router.push('/promo')} style={st.premium} scale={0.98}>
            <Grad from="#FFD56A" to="#F5B82E" style={StyleSheet.absoluteFill} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '800', color: C.amberInk }}>{premium.data?.interested ? 'Kamu sudah terdaftar tertarik' : 'Segera hadir'}</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 2 }}>CalMates Premium</Text>
              <Text style={{ fontSize: 13, color: '#4A3A10', marginTop: 4, lineHeight: 19 }}>Catat makan dari foto, rencana menu 7 hari, dan laporan mingguan.</Text>
            </View>
            <Text style={{ fontSize: 40 }}>📸</Text>
          </Tap>

          <Card style={{ overflow: 'hidden' }}>
            <Row icon="book" label="Aturan komunitas" onPress={() => router.push('/rules')} />
            {secured && <Row icon="user" label="Ganti kata sandi" sub={`Masuk sebagai @${u?.handle}`} border onPress={() => router.push('/secure')} />}
            <Row icon="logout" label="Keluar" border onPress={signOut} />
            <Row icon="close" label="Hapus akun dan data" border danger onPress={deleteAccount} />
          </Card>
          <Small style={{ textAlign: 'center' }}>CalMates · komunitas gratis</Small>
        </View>
      </ScrollView>

      <Sheet visible={edit} onClose={() => setEdit(false)} title="Ubah profil">
        <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
          <Text style={[s.label, { marginTop: 0 }]}>Nama panggilan</Text>
          <TextInput value={name} onChangeText={setName} maxLength={24} style={[s.field, { height: 46 }]} accessibilityLabel="Nama panggilan" />
          <Text style={s.label}>Tujuan</Text>
          <View style={{ gap: 6 }}>
            {GOALS.map(([g]) => (
              <RadioRow key={g} on={goal === g} onPress={() => setGoal(g)} title={g} />
            ))}
          </View>
          <Text style={s.label}>Topik</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TOPICS.map((t) => (
              <Chip key={t} label={t} on={topics.includes(t)} onPress={() => setTopics((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
            ))}
          </View>
        </ScrollView>
        <Btn title="Simpan" loading={saving} disabled={name.trim().length < 2} onPress={save} style={{ marginTop: 14 }} />
      </Sheet>
    </View>
  );
}

function Row({ label, sub, onPress, border, danger, icon }: { label: string; sub?: string; onPress: () => void; border?: boolean; danger?: boolean; icon: IconName }) {
  return (
    <Tap accessibilityRole="button" onPress={onPress} scale={0.99} style={[{ minHeight: 60, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, border && { borderTopWidth: 1, borderTopColor: C.lineSoft }]}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: danger ? '#FDECEC' : C.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={danger ? C.red : C.acc} stroke={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: danger ? C.red : C.ink, fontWeight: '700' }}>{label}</Text>
        {sub ? <Small>{sub}</Small> : null}
      </View>
      {!danger && <Icon name="chev" size={16} color={C.muted} />}
    </Tap>
  );
}

const st = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingBottom: 46, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(47,181,122,0.35)', top: -90, right: -70 },
  avRing: { padding: 3, borderRadius: 40, backgroundColor: C.kunyit },
  edit: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 38, justifyContent: 'center' },
  stats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: R.card, paddingVertical: 12, ...shadow(2) },
  stat: { flex: 1, alignItems: 'center', gap: 1 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: R.card, backgroundColor: '#FFF8E6', borderWidth: 1.5, borderColor: '#F5D27A', ...shadow(1) },
  sw: { width: 48, height: 28, borderRadius: 14, backgroundColor: C.line, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', ...shadow(1) },
  premium: { borderRadius: R.card, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', ...shadow(2, '#8A5A00') },
});
