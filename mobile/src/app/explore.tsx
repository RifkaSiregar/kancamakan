import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { PostCard } from '../components/PostCard';
import { Card, Empty, IconBtn, Pill, QueryState, Small, s } from '../components/ui';
import { useQuery } from '../lib/query';
import type { Food, Post } from '../lib/types';
import { qs } from '../services/api';
import { C } from '../theme';

const SUGGEST = ['tempe', 'warteg', 'kopi', 'sarapan', 'sayur', 'camilan'];

/** Cari postingan komunitas dan database makanan sekaligus. */
export default function Explore() {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const posts = useQuery<{ posts: Post[] }>(term ? `/api/posts${qs({ q: term, limit: 20 })}` : null);
  const foods = useQuery<{ foods: Food[] }>(term ? `/api/foods${qs({ q: term })}` : null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.bar}>
        <IconBtn name="back" label="Kembali" size={20} onPress={back} />
        <View style={st.search}>
          <Icon name="search" size={18} color={C.muted} />
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Cari makanan atau postingan" accessibilityLabel="Cari" returnKeyType="search" style={{ flex: 1, fontSize: 14, color: C.ink }} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {!term ? (
          <>
            <Text style={[s.h2, { marginTop: 8 }]}>Coba cari</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SUGGEST.map((t) => (
                <Pressable key={t} accessibilityRole="button" onPress={() => setQ(t)}>
                  <Pill label={t} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 }} />
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            {(foods.data?.foods.length ?? 0) > 0 && (
              <>
                <Text style={[s.h2, { marginTop: 8 }]}>Di database makanan</Text>
                <Card>
                  {foods.data!.foods.slice(0, 5).map((f, i) => (
                    <Pressable key={f.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/food/[id]', params: { id: f.id } })} style={[st.row, i > 0 && { borderTopWidth: 1, borderTopColor: C.lineSoft }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink }}>{f.name}</Text>
                        <Small>{f.portion}</Small>
                      </View>
                      <Small>±{Math.round(f.kcal)} kkal</Small>
                      <Icon name="chev" size={14} color={C.muted} />
                    </Pressable>
                  ))}
                </Card>
              </>
            )}
            <Text style={[s.h2, { fontSize: 15 }]}>Postingan komunitas</Text>
            {posts.data?.posts.length ? (
              <View style={{ gap: 12 }}>
                {posts.data.posts.map((p) => (
                  <PostCard key={p.id} p={p} />
                ))}
              </View>
            ) : (
              <QueryState
                loading={posts.loading}
                error={posts.error}
                onRetry={posts.refresh}
                empty={
                  <View style={{ marginHorizontal: -18 }}>
                    <Empty title="Belum ada yang membahas ini" body="Tanyakan ke komunitas, siapa tahu ada yang punya pengalaman." action={{ label: 'Buat pertanyaan', onPress: () => router.push({ pathname: '/compose', params: { type: 'Tanya' } }) }} />
                  </View>
                }
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  search: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  row: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
