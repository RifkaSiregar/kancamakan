import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MacroBar, MACRO_COLORS } from '../../components/Macro';
import { PostCard } from '../../components/PostCard';
import { Text } from '../../components/Text';
import { Btn, Empty, IconBtn, QueryState, Section, Seg, Small, Tap, s } from '../../components/ui';
import { useQuery } from '../../lib/query';
import type { Food, Post } from '../../lib/types';
import { C, CATEGORY_EMOJI, CATEGORY_TINT, foodEmoji, R, T, shadow } from '../../theme';

const fmt = (n: number | null | undefined) => (n == null ? '–' : (Math.round(n * 10) / 10).toLocaleString('id-ID'));
const GRAMS: [string, number][] = [['50 g', 50], ['100 g', 100], ['150 g', 150], ['200 g', 200]];

/** Detail makanan dari database + diskusi komunitas tentang makanan ini. */
export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ins = useSafeAreaInsets();
  const q = useQuery<{ food: Food; similar: Food[] }>(`/api/foods/${id}`);
  const posts = useQuery<{ posts: Post[] }>(`/api/posts?food=${encodeURIComponent(id ?? '')}&limit=10`);
  const f = q.data?.food;
  const [grams, setGrams] = useState(100);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/foods'));

  if (!f) {
    return (
      <View style={[s.screen, { paddingTop: ins.top }]}>
        <View style={s.bar}>
          <IconBtn name="back" label="Kembali" size={20} onPress={back} />
        </View>
        <QueryState loading={q.loading} error={q.error} onRetry={q.refresh} empty={<Empty emoji="🔍" title="Makanan tidak ditemukan" body="Coba cari lagi di database makanan." />} />
      </View>
    );
  }

  const tint = CATEGORY_TINT[f.category] ?? C.soft;
  // Data TKPI/USDA per 100 g → bisa dihitung ulang sesuai porsi. Data CalMates sudah per porsi.
  const per100 = f.source !== 'CalMates';
  const k = per100 ? grams / 100 : 1;
  const sc = (n: number | null) => (n == null ? null : n * k);
  const macros: [keyof typeof MACRO_COLORS | 'fiber', string, number | null][] = [
    ['protein', 'Protein', sc(f.protein)],
    ['fat', 'Lemak', sc(f.fat)],
    ['carb', 'Karbo', sc(f.carb)],
    ['fiber', 'Serat', sc(f.fiber)],
  ];

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Hero berwarna sesuai kategori, dengan emoji besar sebagai "foto" */}
        <View style={[st.hero, { backgroundColor: tint, paddingTop: ins.top + 8 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconBtn name="back" label="Kembali" size={20} onPress={back} />
          </View>
          <View style={st.plate}>
            <Text style={{ fontSize: 64 }}>{foodEmoji(f.name, f.category)}</Text>
          </View>
          <Text style={{ textAlign: 'center', fontSize: 12.5, fontWeight: '700', color: C.muted }}>{f.category}</Text>
          <Text style={{ textAlign: 'center', ...T.display, color: C.ink, marginTop: 2 }}>{f.name}</Text>
          {!!f.nameEn && <Text style={{ textAlign: 'center', fontSize: 13, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>{f.nameEn}</Text>}
          <Text style={{ textAlign: 'center', ...T.small, color: C.muted, marginTop: 2 }}>{per100 ? `Data per 100 g · ${f.sourceLabel ?? f.source}` : `per ${f.portion}`}</Text>
        </View>

        <View style={{ paddingHorizontal: 18, marginTop: -36, gap: 14 }}>
          <View style={st.nutri}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Small>Perkiraan energi</Small>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 40, lineHeight: 46, fontWeight: '800', color: C.ink, letterSpacing: -1 }}>{Math.round(f.kcal * k)}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.muted }}>kkal</Text>
                </View>
              </View>
              <View style={st.portion}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.accDark }}>{per100 ? `${grams} g` : '1 porsi'}</Text>
              </View>
            </View>
            {per100 && (
              <View style={{ marginTop: 12 }}>
                <Seg label="Porsi dalam gram" value={grams} onChange={setGrams} options={GRAMS} />
              </View>
            )}
            <View style={{ marginTop: 12 }}>
              <MacroBar protein={f.protein} fat={f.fat} carb={f.carb} height={12} />
            </View>
            <View style={st.grid}>
              {macros.map(([k, label, v]) => (
                <View key={k} style={st.cell}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: k === 'fiber' ? '#B98A62' : MACRO_COLORS[k] }} />
                    <Small>{label}</Small>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 2 }}>
                    {fmt(v)} <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>g</Text>
                  </Text>
                </View>
              ))}
            </View>
            {(f.sugar != null || f.sodium != null) && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {f.sugar != null && (
                  <View style={st.cell}>
                    <Small>Gula</Small>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink }}>{fmt(sc(f.sugar))} g</Text>
                  </View>
                )}
                {f.sodium != null && (
                  <View style={st.cell}>
                    <Small>Natrium</Small>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink }}>{fmt(sc(f.sodium))} mg</Text>
                  </View>
                )}
              </View>
            )}
            <Small style={{ marginTop: 12 }}>
              {per100 ? `Sumber: ${f.sourceLabel ?? f.source}. Nilai bahan bisa berbeda setelah dimasak.` : 'Bisa berbeda tergantung resep dan ukuran porsi.'} Bukan saran medis.
            </Small>
          </View>

          {!!f.tip && (
            <View style={st.tip}>
              <View style={st.tipIcon}>
                <Text style={{ fontSize: 18 }}>💡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: C.amberInk }}>Tips sehat</Text>
                <Text style={{ fontSize: 14.5, lineHeight: 21, color: C.ink, marginTop: 2 }}>{f.tip}</Text>
              </View>
            </View>
          )}

          {f.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {f.tags.map((t) => {
                const warn = ['digoreng', 'manis', 'santan', 'gorengan'].includes(t);
                return (
                  <View key={t} style={[st.tag, warn && { backgroundColor: C.amber }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: warn ? C.amberInk : C.accDark }}>{t}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <Btn title={`Tanya komunitas soal ${f.name.toLowerCase()}`} icon="msg" onPress={() => router.push({ pathname: '/compose', params: { type: 'Tanya', foodId: f.id, foodLabel: f.name } })} />

          <Section title="Dibahas di komunitas" />
          {posts.data?.posts.length ? (
            <View style={{ gap: 14 }}>
              {posts.data.posts.map((p) => (
                <PostCard key={p.id} p={p} />
              ))}
            </View>
          ) : (
            <QueryState loading={posts.loading} error={posts.error} empty={<Small>Belum ada yang membahas {f.name.toLowerCase()}. Jadilah yang pertama!</Small>} />
          )}

          {q.data!.similar.length > 0 && (
            <>
              <Section title="Makanan serupa" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6, paddingHorizontal: 18 }} style={{ marginHorizontal: -18 }}>
                {q.data!.similar.map((x) => (
                  <Tap key={x.id} accessibilityRole="button" accessibilityLabel={x.name} onPress={() => router.push({ pathname: '/food/[id]', params: { id: x.id } })} style={st.sim}>
                    <View style={[st.simIcon, { backgroundColor: CATEGORY_TINT[x.category] ?? C.soft }]}>
                      <Text style={{ fontSize: 22 }}>{foodEmoji(x.name, x.category)}</Text>
                    </View>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.ink }} numberOfLines={2}>
                      {x.name}
                    </Text>
                    <Small>{Math.round(x.kcal)} kkal</Small>
                  </Tap>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingBottom: 56, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  plate: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center', marginTop: -6, marginBottom: 10, borderWidth: 4, borderColor: '#fff', ...shadow(2) },
  nutri: { backgroundColor: '#fff', borderRadius: R.card, padding: 18, ...shadow(2) },
  portion: { backgroundColor: C.soft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8 },
  cell: { flexGrow: 1, flexBasis: '45%', backgroundColor: C.bg, borderRadius: 14, padding: 12 },
  tip: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: R.tile, backgroundColor: C.amber },
  tipIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tag: { backgroundColor: C.soft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  sim: { width: 132, padding: 12, gap: 6, borderRadius: R.tile, backgroundColor: '#fff', ...shadow(1) },
  simIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
