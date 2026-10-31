import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { MacroBar } from '../../components/Macro';
import { Text, TextInput } from '../../components/Text';
import { Chip, Empty, QueryState, Skeleton, Small, Tap, s } from '../../components/ui';
import { FOOD_CATEGORIES } from '../../data/sample';
import { mutate, useQuery } from '../../lib/query';
import type { Food, FoodSource } from '../../lib/types';
import { api, qs } from '../../services/api';
import { C, CATEGORY_EMOJI, CATEGORY_TINT, R, T, foodEmoji, shadow } from '../../theme';
import { toastError } from '../../store';

type Res = { foods: Food[]; total: number; next: number | null; counts: Record<FoodSource, number> };

const GOOD = ['tinggi protein', 'tinggi serat', 'hemat', 'rendah gula', 'rendah lemak'];
const WATCH = ['digoreng', 'manis', 'santan'];
const SOURCES: [string, FoodSource | '', string][] = [
  ['Semua', '', '🍽️'],
  ['Populer', 'CalMates', '⭐'],
  ['Indonesia (TKPI)', 'TKPI', '🇮🇩'],
  ['Internasional', 'USDA', '🌏'],
];
const fmtN = (n?: number) => (n ?? 0).toLocaleString('id-ID');

/** Database makanan: ribuan makanan dari kurasi CalMates, TKPI Kemenkes, dan USDA. */
export default function Foods() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [cat, setCat] = useState('');
  const [source, setSource] = useState<FoodSource | ''>('');
  const [more, setMore] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const key = `/api/foods${qs({ q: debounced, category: cat, source })}`;
  const res = useQuery<Res>(key);
  const foods = res.data?.foods ?? [];
  const counts = res.data?.counts;
  const all = counts ? counts.CalMates + counts.TKPI + counts.USDA : 0;

  const loadMore = async () => {
    const next = res.data?.next;
    if (next == null || more) return;
    setMore(true);
    try {
      const r = await api.get<Res>(`/api/foods${qs({ q: debounced, category: cat, source, offset: next })}`);
      mutate<Res>(key, (d) => ({ ...r, foods: [...d.foods, ...r.foods.filter((f) => !d.foods.some((x) => x.id === f.id))] }));
    } catch (e) {
      toastError(e);
    } finally {
      setMore(false);
    }
  };

  const header = (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingTop: 12 }} accessibilityLabel="Sumber data">
        {SOURCES.map(([label, val, e]) => (
          <Chip key={label} label={counts ? `${label} · ${fmtN(val ? counts[val] : all)}` : label} emoji={e} on={source === val} onPress={() => setSource(val)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingVertical: 10 }} accessibilityLabel="Kategori">
        {['', ...FOOD_CATEGORIES].map((c) => (
          <Tap key={c || 'semua'} accessibilityRole="button" accessibilityState={{ selected: cat === c }} onPress={() => setCat(c)} style={[st.cat, cat === c && st.catOn]}>
            <Text style={{ fontSize: 13 }}>{c ? CATEGORY_EMOJI[c] : '🗂️'}</Text>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: cat === c ? C.accDark : C.muted }}>{c || 'Semua kategori'}</Text>
          </Tap>
        ))}
      </ScrollView>
      {res.data && (
        <Small style={{ marginHorizontal: 18, marginBottom: 8 }}>
          {debounced || cat || source ? `${fmtN(res.data.total)} makanan ditemukan` : `${fmtN(res.data.total)} makanan · urut dari yang populer`}
        </Small>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <Text style={{ ...T.h1, color: C.ink }}>Database makanan</Text>
        <Text style={{ ...T.small, color: C.muted, marginTop: 2 }}>{all ? `${fmtN(all)} makanan dari CalMates, TKPI Kemenkes, dan USDA` : 'Perkiraan gizi makanan sehari-hari'}</Text>
        <View style={st.search}>
          <Icon name="search" size={19} color={C.acc} stroke={2.2} />
          <TextInput value={q} onChangeText={setQ} placeholder="Cari tempe, kangkung, chicken…" accessibilityLabel="Cari makanan" returnKeyType="search" style={{ flex: 1, fontSize: 15, color: C.ink }} />
          {!!q && (
            <Tap accessibilityRole="button" accessibilityLabel="Hapus pencarian" onPress={() => setQ('')} style={st.clear}>
              <Icon name="close" size={14} color={C.muted} stroke={2.4} />
            </Tap>
          )}
        </View>
      </View>
      <FlatList
        data={foods}
        keyExtractor={(f) => f.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 130 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item: f }) => {
          const good = f.tags.filter((t) => GOOD.includes(t)).slice(0, 2);
          const watch = f.tags.filter((t) => WATCH.includes(t)).slice(0, 1);
          return (
            <Tap
              accessibilityRole="button"
              accessibilityLabel={`${f.name}, sekitar ${Math.round(f.kcal)} kilokalori per ${f.portion}`}
              onPress={() => router.push({ pathname: '/food/[id]', params: { id: f.id } })}
              style={[st.row, { marginHorizontal: 18 }]}
              scale={0.98}
            >
              <View style={[st.tile, { backgroundColor: CATEGORY_TINT[f.category] ?? C.soft }]}>
                <Text style={{ fontSize: 26 }}>{foodEmoji(f.name, f.category)}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.ink }} numberOfLines={2}>
                  {f.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {f.source !== 'CalMates' && (
                    <View style={[st.src, f.source === 'USDA' && { backgroundColor: C.blueSoft }]}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: f.source === 'USDA' ? '#244A7A' : C.accDark }}>{f.source}</Text>
                    </View>
                  )}
                  <Small style={{ flexShrink: 1 }} >{f.source === 'CalMates' ? f.portion : `per ${f.portion}`}</Small>
                </View>
                <MacroBar protein={f.protein} fat={f.fat} carb={f.carb} height={6} />
                {(good.length > 0 || watch.length > 0) && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                    {good.map((t) => (
                      <View key={t} style={st.tagGood}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: C.accDark }}>{t}</Text>
                      </View>
                    ))}
                    {watch.map((t) => (
                      <View key={t} style={st.tagWatch}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: C.amberInk }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={st.kcal}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: -0.3 }}>{Math.round(f.kcal)}</Text>
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: C.muted }}>kkal</Text>
              </View>
            </Tap>
          );
        }}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 18 }}>
            <QueryState
              loading={res.loading}
              error={res.error}
              onRetry={res.refresh}
              skeleton={
                <View style={{ gap: 10 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} style={{ height: 88, borderRadius: R.tile }} />
                  ))}
                </View>
              }
              empty={<Empty emoji="🔍" title="Makanan tidak ditemukan" body="Coba kata lain atau nama dalam bahasa Inggris, atau tanyakan ke komunitas." action={{ label: 'Tanya komunitas', onPress: () => router.push({ pathname: '/compose', params: { type: 'Tanya' } }) }} />}
            />
          </View>
        }
        ListFooterComponent={
          more ? (
            <ActivityIndicator color={C.acc} style={{ margin: 18 }} />
          ) : foods.length ? (
            <Small style={{ textAlign: 'center', marginTop: 16, marginHorizontal: 24 }}>
              Bilah warna: protein (hijau), lemak (kuning), karbo (biru). Data TKPI (Kemenkes, panganku.org) dan USDA FoodData Central per 100 g; data CalMates per porsi umum. Perkiraan, bukan saran medis.
            </Small>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  search: { marginTop: 14, height: 52, borderRadius: R.btn, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, ...shadow(1) },
  clear: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lineSoft, alignItems: 'center', justifyContent: 'center' },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.7)' },
  catOn: { backgroundColor: C.mint },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: R.tile, backgroundColor: '#fff', ...shadow(1) },
  tile: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  src: { backgroundColor: C.soft, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  kcal: { alignItems: 'center', minWidth: 52, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 14, backgroundColor: C.bg },
  tagGood: { backgroundColor: C.soft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  tagWatch: { backgroundColor: C.amber, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
});
