import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Btn, Empty, Grad, IconBtn, QueryState, Small, s } from '../../components/ui';
import { useQuery } from '../../lib/query';
import type { ContentItem } from '../../lib/types';
import { C } from '../../theme';

/** Pembaca konten (newsletter/artikel dan video contoh) dari Rencana Sehatku. */
export default function ContentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery<{ content: ContentItem }>(`/api/content/${id}`);
  const c = q.data?.content;
  const [playing, setPlaying] = useState(false);

  if (!c || c.premium) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.bar}>
          <IconBtn name="back" label="Kembali" size={20} onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        </View>
        <QueryState loading={q.loading} error={q.error} onRetry={q.refresh} empty={<Empty title={c ? 'Konten Premium' : 'Konten tidak ditemukan'} body={c ? 'Konten ini akan tersedia untuk pelanggan Premium.' : 'Mungkin sudah dipindahkan.'} />} />
      </SafeAreaView>
    );
  }

  const video = c.type === 'video';

  return (
    <SafeAreaView style={s.screen}>
      <View style={[s.bar, { justifyContent: 'space-between' }]}>
        <IconBtn name="back" label="Kembali" size={20} onPress={() => router.back()} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{video ? 'Video' : 'Bacaan'}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 28 }}>
        <Pressable disabled={!video} accessibilityRole={video ? 'button' : undefined} accessibilityLabel={video ? (playing ? 'Jeda video' : 'Putar video') : undefined} onPress={() => setPlaying((p) => !p)}>
          <Grad from={c.g[0]} to={c.g[1]} style={[st.hero, video && { height: 200 }]}>
            {video && (
              <>
                <View style={st.play}>
                  <Icon name={playing ? 'pause' : 'play'} size={24} color={C.dark} fill={playing ? 'none' : C.dark} stroke={2.4} />
                </View>
                <Text style={st.lbl}>{playing ? 'Memutar video contoh…' : `Video contoh · ${c.minutes} mnt`}</Text>
              </>
            )}
          </Grad>
        </Pressable>
        <Small style={{ marginTop: 14, fontWeight: '700', color: C.acc }}>
          {video ? 'Video' : 'Newsletter'} · {c.topic} · {c.minutes} mnt
        </Small>
        <Text style={{ marginTop: 4, fontSize: 22, lineHeight: 28, fontWeight: '800', color: C.ink }}>{c.title}</Text>
        <Text style={{ marginTop: 10, fontSize: 15, lineHeight: 23, fontWeight: '600', color: '#3E4F45' }}>{c.summary}</Text>
        {video && <Text style={[s.h2, { marginTop: 16 }]}>Ringkasan video</Text>}
        <View style={{ gap: 12, marginTop: video ? 0 : 14 }}>
          {(c.body ?? []).map((p, i) => (
            <Text key={i} style={{ fontSize: 15, lineHeight: 24, color: C.ink }}>
              {video ? `${i + 1}. ` : ''}
              {p}
            </Text>
          ))}
        </View>
        <Small style={{ marginTop: 16 }}>Konten contoh. Informasi umum, bukan pengganti konsultasi medis.</Small>
        {<Btn title="Diskusikan di komunitas" variant="secondary" style={{ marginTop: 16 }} onPress={() => router.push({ pathname: '/compose', params: { type: 'Bagikan', topic: c.topic } })} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  hero: { height: 120, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  play: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  lbl: { position: 'absolute', left: 12, bottom: 10, fontSize: 12, fontWeight: '700', color: '#fff' },
});
