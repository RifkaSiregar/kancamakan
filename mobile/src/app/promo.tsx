import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Plate } from '../components/Plate';
import { Btn, Card, Grad, IconBtn, LinkBtn, Pill, Small, Tap, s } from '../components/ui';
import { PRICE_MONTH_EQ, PRICE_YEAR } from '../data/sample';
import { mutate, useQuery } from '../lib/query';
import { api } from '../services/api';
import { toast, toastError, useApp } from '../store';
import { C, R, shadow } from '../theme';

type Premium = { interested: boolean; count: number };

/** Pratinjau fitur Premium (belum tersedia) + pendaftaran minat yang tersimpan di server. */
export default function Promo() {
  const watchedDemo = useApp((st) => st.watchedDemo);
  const q = useQuery<Premium>('/api/premium');
  const [busy, setBusy] = useState(false);
  const interested = q.data?.interested ?? false;

  const toggle = async () => {
    setBusy(true);
    try {
      const r = await api.post<Premium>('/api/premium/interest');
      mutate<Premium>('/api/premium', () => r);
      if (r.interested) router.replace('/waitlist');
      else toast('Kamu tidak lagi terdaftar tertarik');
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <View style={[s.bar, { justifyContent: 'space-between' }]}>
        <IconBtn name="back" label="Kembali" size={20} onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Pill label="Segera hadir" tone="a" />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18 }}>
        <Text style={{ marginTop: 4, fontSize: 30, lineHeight: 36, fontWeight: '800', color: C.ink, letterSpacing: -0.6 }}>CalMates Premium</Text>
        <Text style={{ marginTop: 4, marginBottom: 14, fontSize: 15, lineHeight: 22, color: C.muted }}>Untuk kamu yang ingin melangkah lebih jauh. Komunitas tetap gratis.</Text>
        <Tap accessibilityRole="button" accessibilityLabel="Putar video demo" onPress={() => router.push('/demo')} style={st.video} scale={0.98}>
          <Grad from="#1E3D30" to="#0B1F16" style={StyleSheet.absoluteFill} />
          <View style={st.glow} />
          <View style={st.phone}>
            <Plate size={96} />
            <View style={st.scanCorner} />
            <View style={st.scanCornerR} />
          </View>
          {['🍛', '📊', '✅'].map((e, i) => (
            <View key={e} style={[st.float, [{ left: 36, top: 44 }, { right: 34, top: 64 }, { right: 60, bottom: 46 }][i]]}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </View>
          ))}
          <View style={st.play}>
            <Icon name="play" size={22} color={C.ink} fill={C.ink} stroke={2} />
          </View>
          <View style={st.tagTop}>
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: C.ink }}>Demo 30 detik</Text>
          </View>
          <Text style={st.tagBottom}>{watchedDemo ? 'Sudah ditonton. Putar lagi' : 'Lihat cara kerjanya'}</Text>
        </Tap>
        <View style={{ gap: 10, marginVertical: 16 }}>
          {(
            [
              ['📸', 'Catat makan cukup dari foto', 'Dapat 3 tebakan nama makanan, kamu pilih yang benar'],
              ['🗓️', 'Rencana menu 7 hari + daftar belanja', 'Disusun dari Rencana Sehatku-mu'],
              ['📈', 'Ringkasan harian & laporan mingguan', 'Lihat pola makanmu dari waktu ke waktu'],
            ] as const
          ).map(([e, t, d]) => (
            <Card key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={st.benefitIcon}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.ink }}>{t}</Text>
                <Small>{d}</Small>
              </View>
            </Card>
          ))}
        </View>
        <Card style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Small style={{ flex: 1 }}>{'Rencana harga (contoh)\nKomunitas tetap gratis'}</Small>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{PRICE_YEAR} / tahun</Text>
            <Small>{PRICE_MONTH_EQ}</Small>
          </View>
        </Card>
        <View style={{ flex: 1, minHeight: 16 }} />
        <Btn title={interested ? 'Kamu sudah terdaftar tertarik ✓' : 'Saya tertarik, kabari saya'} variant={interested ? 'secondary' : 'kunyit'} loading={busy} onPress={interested ? () => toast('Kami kabari saat Premium tersedia') : toggle} />
        {interested ? <LinkBtn title="Batalkan minat" muted onPress={toggle} /> : <LinkBtn title="Belum sekarang" muted onPress={() => router.back()} />}
        <Small style={{ textAlign: 'center', marginBottom: 14 }}>
          Fitur belum tersedia dan belum ada pembayaran. {q.data ? `${q.data.count} orang sudah tertarik.` : ''}
        </Small>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  video: { height: 230, borderRadius: R.hero, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadow(3) },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(47,181,122,0.22)' },
  phone: { width: 128, height: 150, borderRadius: 24, backgroundColor: '#13261D', borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  scanCorner: { position: 'absolute', left: 10, top: 10, width: 18, height: 18, borderColor: C.kunyit, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  scanCornerR: { position: 'absolute', right: 10, top: 10, width: 18, height: 18, borderColor: C.kunyit, borderTopWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  float: { position: 'absolute', width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow(2) },
  play: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: C.kunyit, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)' },
  tagTop: { position: 'absolute', left: 14, top: 14, backgroundColor: C.kunyit, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagBottom: { position: 'absolute', left: 16, bottom: 14, fontSize: 13, fontWeight: '700', color: '#fff' },
  benefitIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
});
