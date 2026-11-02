import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Progress } from '../../components/Progress';
import { Text, TextInput } from '../../components/Text';
import { Btn, Chip, IconBtn, LinkBtn, RadioRow, Seg, Small, Tap, s } from '../../components/ui';
import { GOALS, TOPICS } from '../../data/sample';
import { clearCache, invalidate } from '../../lib/query';
import type { User } from '../../lib/types';
import { api } from '../../services/api';
import { registerPushToken } from '../../services/notify';
import { useT } from '../../i18n';
import { toast, toastError, useApp } from '../../store';
import { C, shadow } from '../../theme';

const EXAMPLES: [string, string][] = [
  ['🏢', 'Kerja kantoran, sering makan di warteg, suka gorengan. Mau turun berat badan pelan-pelan.'],
  ['🎒', 'Mahasiswa anak kos, budget tipis, pengen makan lebih sehat.'],
  ['☕', 'Suka minum kopi susu dan teh manis tiap hari, mau mengurangi gula.'],
  ['👩‍🍳', 'Ibu rumah tangga, pengen masak menu sehat yang disukai anak-anak.'],
];

const STEPS = ['Membuat akunmu…', 'Memahami ceritamu…', 'Menyusun tantangan 7 hari…', 'Memilih ide menu…', 'Mencarikan bacaan & video…'];

type Mode = 'ai' | 'manual';

/** Daftar akun (nama pengguna + kata sandi) sekaligus menyusun rencana: dibantu Agent AI atau pilih manual. */
export default function Register() {
  const t = useT();
  const { token, setSession, setUser } = useApp();
  // Setelah akun dibuat (misalnya kembali dari layar rencana), bagian akun tidak ditampilkan lagi.
  const registered = !!token;
  const [mode, setMode] = useState<Mode>('ai');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [goal, setGoal] = useState(GOALS[2][0]);
  const [topics, setTopics] = useState<string[]>(['Meal prep']);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const toggle = (v: string) => setTopics((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]));

  const h = handle.trim().toLowerCase();
  const accountOk = registered || (name.trim().length >= 2 && /^[a-z0-9_.]{3,20}$/.test(h) && password.length >= 8);
  const ok = accountOk && (mode === 'ai' ? input.trim().length >= 5 : topics.length > 0);

  useEffect(() => {
    if (!busy || mode !== 'ai') return;
    setStep(registered ? 1 : 0);
    const t = setInterval(() => setStep((x) => Math.min(x + 1, STEPS.length - 1)), 900);
    return () => clearInterval(t);
  }, [busy, mode, registered]);

  const go = async () => {
    setBusy(true);
    try {
      if (!useApp.getState().token) {
        const r = await api.post<{ token: string; user: User }>('/api/auth/register', {
          name: name.trim(),
          handle: h,
          password,
          ...(mode === 'manual' ? { goal, topics } : {}),
        });
        clearCache();
        setSession(r.token, r.user);
        registerPushToken();
      }
      if (mode === 'manual') {
        router.dismissAll();
        router.replace('/home');
        toast(t('Selamat datang, {name}!', { name: useApp.getState().user?.name ?? '' }));
        return;
      }
      try {
        await api.post('/api/agent/plan', { input: input.trim() }, 60000);
      } catch (e) {
        // Akun sudah jadi; rencana bisa dibuat ulang nanti dari Beranda atau Profil.
        router.dismissAll();
        router.replace('/home');
        toastError(e, t('Agent gagal menyusun rencana. Coba lagi dari Profil.'));
        return;
      }
      invalidate('/api/plan');
      const me = await api.get<{ user: User }>('/api/me');
      setUser(me.user);
      router.push({ pathname: '/plan', params: { from: 'onboarding' } });
    } catch (e) {
      toastError(e, t('Pendaftaran gagal'));
    } finally {
      setBusy(false);
    }
  };

  if (busy && mode === 'ai') {
    return (
      <SafeAreaView style={[s.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <View style={st.orb}>
          <Icon name="spark" size={44} color="#fff" stroke={1.8} />
        </View>
        <Text style={{ marginTop: 22, fontSize: 20, fontWeight: '800', color: C.ink, textAlign: 'center' }}>{t('Menyusun Rencana Sehatku')}</Text>
        <View style={{ marginTop: 16, gap: 10, alignSelf: 'stretch', maxWidth: 320, marginHorizontal: 'auto' }} accessibilityLiveRegion="polite">
          {STEPS.map((x, i) => (
            <View key={x} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: i <= step ? 1 : 0.35 }}>
              {i < step ? <Icon name="check" size={18} color={C.acc} stroke={3} /> : i === step ? <ActivityIndicator size="small" color={C.acc} /> : <View style={{ width: 18 }} />}
              <Text style={{ fontSize: 14, color: C.ink, fontWeight: i === step ? '700' : '500' }}>{t(x)}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const field = [s.field, { height: 52, borderColor: 'transparent', ...shadow(1) }];

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 18, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
          <IconBtn name="back" label={t('Kembali')} onPress={() => (router.canGoBack() ? router.back() : router.replace(registered ? '/home' : '/onboarding'))} style={{ marginBottom: 10 }} />
          <Progress step={2} total={mode === 'ai' ? 3 : 2} />
          <Text style={{ fontSize: 28, lineHeight: 34, fontWeight: '800', color: C.ink, letterSpacing: -0.6 }}>{registered ? t('Susun rencanamu') : t('Buat akunmu')}</Text>
          <Text style={{ marginTop: 6, marginBottom: 4, fontSize: 13.5, lineHeight: 20, color: C.muted }}>
            {registered ? t('Akunmu sudah jadi. Tinggal ceritakan dirimu atau pilih tujuan.') : t('Nama pengguna dan kata sandi dipakai untuk masuk lagi dari perangkat mana pun.')}
          </Text>

          {!registered && (
            <>
              <Text style={s.label}>{t('Nama panggilan')}</Text>
              <TextInput value={name} onChangeText={setName} placeholder={t('Misalnya Rani')} maxLength={24} style={field} accessibilityLabel={t('Nama panggilan')} />
              <Small style={{ marginTop: 4 }}>{t('Ditampilkan di komunitas.')}</Small>
              <Text style={s.label}>{t('Nama pengguna')}</Text>
              <TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} placeholder={t('misalnya rani.sehat')} maxLength={20} style={field} accessibilityLabel={t('Nama pengguna')} textContentType="username" />
              <Small style={{ marginTop: 4, color: handle && !/^[a-z0-9_.]{3,20}$/.test(h) ? C.red : C.muted }}>{t('3–20 karakter: huruf kecil, angka, titik, atau garis bawah.')}</Small>
              <Text style={s.label}>{t('Kata sandi')}</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder={t('Minimal 8 karakter')} style={field} accessibilityLabel={t('Kata sandi')} textContentType="newPassword" />
            </>
          )}

          <Text style={[s.label, { marginTop: 22 }]}>{t('Bagaimana rencanamu disusun?')}</Text>
          <Seg
            label={t('Cara menyusun rencana')}
            value={mode}
            onChange={setMode}
            options={[
              [t('✨ Dibantu AI'), 'ai'],
              [t('Pilih manual'), 'manual'],
            ]}
          />

          {mode === 'ai' ? (
            <>
              <Text style={{ marginTop: 14, marginBottom: 10, fontSize: 13.5, lineHeight: 20, color: C.muted }}>
                {t('Ceritakan dirimu dalam satu kalimat. Agent menyusun tantangan 7 hari, ide menu, dan bacaan pilihan. Tanpa hitung kalori.')}
              </Text>
              <TextInput
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={300}
                placeholder={t('Contoh: kerja kantoran, sering makan di warteg, suka gorengan. Mau lebih sehat.')}
                style={[s.field, { minHeight: 110, fontSize: 15.5, lineHeight: 22, ...shadow(1), borderColor: 'transparent' }]}
                accessibilityLabel={t('Ceritakan dirimu')}
              />
              <Small style={{ textAlign: 'right', marginTop: 4 }}>{input.length}/300</Small>
              <Text style={[s.label, { marginTop: 4 }]}>{t('Atau pilih contoh')}</Text>
              <View style={{ gap: 8 }}>
                {EXAMPLES.map(([e, raw]) => [e, t(raw)]).map(([e, ex]) => (
                  <Tap key={ex} accessibilityRole="button" onPress={() => setInput(ex)} style={[st.ex, input === ex && { borderColor: C.acc, backgroundColor: '#F4FBF7' }]} scale={0.98}>
                    <View style={st.exIcon}>
                      <Text style={{ fontSize: 18 }}>{e}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 19, color: C.ink, fontWeight: '500' }}>{ex}</Text>
                  </Tap>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={{ marginTop: 14, marginBottom: 10, fontSize: 13.5, color: C.muted }}>{t('Beranda disusun sesuai pilihanmu. Bisa diubah kapan saja.')}</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={t('Tujuan')} style={{ gap: 8 }}>
                {GOALS.map(([g, sub]) => (
                  <RadioRow key={g} on={goal === g} onPress={() => setGoal(g)} title={t(g)} sub={t(sub)} />
                ))}
              </View>
              <Text style={{ marginTop: 18, marginBottom: 2, fontSize: 15, fontWeight: '700', color: C.ink }}>{t('Topik yang kamu minati')}</Text>
              <Small style={{ marginBottom: 8 }}>{t('Pilih minimal satu')}</Small>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TOPICS.map((v) => (
                  <Chip key={v} label={t(v)} on={topics.includes(v)} onPress={() => toggle(v)} />
                ))}
              </View>
            </>
          )}

          <View style={{ flex: 1, minHeight: 16 }} />
          <Btn
            title={mode === 'ai' ? (registered ? t('Buat Rencana Sehatku') : t('Daftar & buat rencana')) : registered ? t('Masuk ke komunitas') : t('Daftar & masuk')}
            icon={mode === 'ai' ? 'spark' : undefined}
            disabled={!ok}
            loading={busy}
            onPress={go}
            style={{ marginTop: 16 }}
          />
          <Small style={{ textAlign: 'center', marginTop: 8 }}>{t('Dengan mendaftar, kamu menyetujui aturan komunitas. Rencana berupa saran umum, bukan pengganti konsultasi medis.')}</Small>
          {!registered && <LinkBtn title={t('Sudah punya akun? Masuk')} muted onPress={() => router.replace('/onboarding/login')} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  orb: { width: 104, height: 104, borderRadius: 52, backgroundColor: C.acc, alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: C.mint, ...shadow(3) },
  ex: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, ...shadow(1) },
  exIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
});
