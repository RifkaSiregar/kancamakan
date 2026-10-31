import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { PostCard } from '../../components/PostCard';
import { ProgressRing } from '../../components/Ring';
import { Chip, Empty, Grad, PostSkeleton, QueryState, Tap, s } from '../../components/ui';
import { TOPICS } from '../../data/sample';
import { FEEDS, invalidate, mutate, useQuery } from '../../lib/query';
import type { Plan, Post } from '../../lib/types';
import { api, qs } from '../../services/api';
import { toast, toastError, useApp } from '../../store';
import { C, R, TOPIC_EMOJI, shadow } from '../../theme';

type Feed = { posts: Post[]; next: number | null };

export default function Home() {
  const { user, filter, setFilter } = useApp();
  const key = `/api/posts${qs({ topic: filter === 'Untukmu' ? '' : filter })}`;
  const feed = useQuery<Feed>(key);
  const planQ = useQuery<{ plan: Plan | null; days: number[] }>('/api/plan');
  const [gen, setGen] = useState(false);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const ins = useSafeAreaInsets();

  const posts = feed.data?.posts ?? [];
  const meQ = useQuery<{ stats: { unread?: number } }>('/api/me');
  const unread = meQ.data?.stats?.unread ?? 0;
  const plan = planQ.data?.plan;
  const planDays = planQ.data?.days ?? [];

  /** Asisten CalMates membuat postingan baru (berbasis database makanan & tips) untuk topik yang dibuka. */
  const generate = async () => {
    if (gen) return;
    setGen(true);
    try {
      const r = await api.post<{ posts: Post[]; ai: boolean }>('/api/ai/feed', { topic: filter === 'Untukmu' ? undefined : filter, count: 2 }, 60000);
      mutate<Feed>(key, (d) => ({ ...d, posts: [...r.posts, ...d.posts] }));
      invalidate(FEEDS);
      toast(`${r.posts.length} postingan baru dari Asisten CalMates`);
    } catch (e) {
      toastError(e, 'Gagal membuat konten');
    } finally {
      setGen(false);
    }
  };

  const loadMore = async () => {
    const next = feed.data?.next;
    if (!next || more) return;
    setMore(true);
    try {
      const r = await api.get<Feed>(`/api/posts${qs({ topic: filter === 'Untukmu' ? '' : filter, before: next })}`);
      mutate<Feed>(key, (d) => ({ posts: [...d.posts, ...r.posts.filter((p) => !d.posts.some((x) => x.id === p.id))], next: r.next }));
    } catch (e) {
      toastError(e);
    } finally {
      setMore(false);
    }
  };

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([feed.refresh(), planQ.refresh(), meQ.refresh()]);
    setRefreshing(false);
  }, [feed, planQ]);

  // Muat ulang saat kembali ke beranda dari layar lain (postingan baru, tanggapan, dll.).
  useEffect(() => {
    const t = setInterval(() => invalidate(key), 60_000);
    return () => clearInterval(t);
  }, [key]);

  const nextTask = plan ? plan.challenge.days[plan.challenge.days.findIndex((_, i) => !planDays.includes(i))] : '';

  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
  const mealQ = hour < 10 ? 'Sarapan apa hari ini?' : hour < 15 ? 'Makan siang apa hari ini?' : hour < 18 ? 'Ngemil apa sore ini?' : 'Makan malam apa hari ini?';

  const header = (
    <View>
      {/* Hero: sapaan + Rencana Sehatku — elemen paling menonjol di aplikasi */}
      <Grad from="#178A60" to="#0B5139" style={[st.hero, { paddingTop: ins.top + 14 }]}>
        <View style={st.leafA} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', fontWeight: '600' }}>
              {greet}, {user?.name ?? 'teman'} 👋
            </Text>
            <Text style={{ fontSize: 27, lineHeight: 33, fontWeight: '800', color: '#fff', letterSpacing: -0.6, marginTop: 2 }}>{mealQ}</Text>
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="Cari" onPress={() => router.push('/explore')} style={st.heroBtn} scale={0.92}>
            <Icon name="search" size={21} color="#fff" stroke={2.2} />
          </Tap>
          <Tap accessibilityRole="button" accessibilityLabel={unread ? `Notifikasi, ${unread} baru` : 'Notifikasi'} onPress={() => router.push('/notifications')} style={st.heroBtn} scale={0.92}>
            <Icon name="bell" size={21} color="#fff" stroke={2.2} />
            {unread > 0 && (
              <View style={st.bellBadge}>
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fff' }}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </Tap>
        </View>

        <Tap
          accessibilityRole="button"
          accessibilityLabel={plan ? 'Buka Rencana Sehatku' : 'Buat Rencana Sehatku'}
          onPress={() => (plan ? router.push('/plan') : router.push({ pathname: '/onboarding/agent', params: { again: '1' } }))}
          style={st.planCard}
        >
          {plan ? (
            <ProgressRing value={planDays.length} max={7} size={58} />
          ) : (
            <View style={st.planIcon}>
              <Icon name="spark" size={24} color={C.ink} stroke={2} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#BFEBD3' }}>{plan ? 'Rencana Sehatku hari ini' : 'Rencana Sehatku'}</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 2, lineHeight: 20 }} numberOfLines={2}>
              {plan ? (planDays.length >= 7 ? 'Tantangan selesai! Buat rencana berikutnya' : nextTask) : 'Ceritakan dirimu, agent AI menyusun rencananya'}
            </Text>
          </View>
          <View style={st.planGo}>
            <Icon name="chev" size={16} color={C.ink} stroke={2.6} />
          </View>
        </Tap>
      </Grad>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 }} accessibilityLabel="Filter topik">
        <Tap accessibilityRole="button" accessibilityLabel="Buat konten AI" disabled={gen} onPress={generate} style={[st.aiChip, gen && { opacity: 0.6 }]}>
          <Icon name="spark" size={15} color={C.ink} stroke={2.2} />
          <Text style={{ fontWeight: '800', fontSize: 13, color: C.ink }}>Konten AI</Text>
        </Tap>
        {['Untukmu', ...TOPICS].map((t) => (
          <Chip key={t} label={t} emoji={TOPIC_EMOJI[t]} on={filter === t} onPress={() => setFilter(t)} />
        ))}
      </ScrollView>

      {gen && (
        <View style={st.gen} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={C.acc} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.accDark, flex: 1 }}>Asisten menyiapkan postingan dari database makanan…</Text>
        </View>
      )}

      <Tap accessibilityRole="button" accessibilityLabel="Lihat demo fitur Premium" onPress={() => router.push('/promo')} style={st.promo} scale={0.98}>
        <Grad from="#1E3D30" to="#0F2A1F" style={StyleSheet.absoluteFill} />
        <View style={st.promoThumb}>
          <Text style={{ fontSize: 30 }}>📸</Text>
          <View style={st.play}>
            <Icon name="play" size={10} color={C.ink} fill={C.ink} stroke={2} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={st.soon}>
            <Text style={{ fontSize: 10.5, fontWeight: '800', color: C.ink }}>Premium segera hadir</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 6 }}>Catat makan cukup dari foto</Text>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Lihat demonya, 30 detik</Text>
        </View>
      </Tap>

      <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink, marginHorizontal: 18, marginTop: 6, marginBottom: 10, letterSpacing: -0.2 }}>{filter === 'Untukmu' ? 'Dari komunitas' : `${TOPIC_EMOJI[filter] ?? ''} ${filter}`}</Text>
    </View>
  );

  return (
    <View style={s.screen}>
      <FlatList
        data={posts}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 18 }}>
            <PostCard p={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          <QueryState
            loading={feed.loading && !feed.data}
            error={feed.data ? undefined : feed.error}
            onRetry={feed.refresh}
            skeleton={
              <View style={{ gap: 14 }}>
                <PostSkeleton />
                <PostSkeleton />
              </View>
            }
            empty={
              <View>
                <Empty emoji={TOPIC_EMOJI[filter] ?? '🍽️'} title="Belum ada postingan di topik ini" body="Jadilah yang pertama membagikan makananmu, atau minta Asisten membuat postingan." action={{ label: 'Buat postingan', onPress: () => router.push('/compose') }} />
                <Pressable accessibilityRole="button" onPress={generate} style={st.genBtn}>
                  <Icon name="spark" size={16} color={C.acc} stroke={2} />
                  <Text style={{ fontWeight: '700', color: C.acc }}>Buat konten AI</Text>
                </Pressable>
              </View>
            }
          />
        }
        ListFooterComponent={more ? <ActivityIndicator color={C.acc} style={{ margin: 16 }} /> : undefined}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={{ paddingBottom: 130 }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingBottom: 18, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  leafA: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(47,181,122,0.35)', top: -90, right: -70 },
  leafB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245,184,46,0.16)', bottom: -60, left: -40 },
  bellBadge: { position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, backgroundColor: C.heart, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F6447' },
  heroBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  planCard: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: R.card, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  planIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.kunyit, alignItems: 'center', justifyContent: 'center' },
  planGo: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.kunyit, alignItems: 'center', justifyContent: 'center' },
  aiChip: { height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.kunyit, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow(1, '#8A5A00') },
  gen: { marginHorizontal: 18, marginTop: 8, paddingHorizontal: 14, minHeight: 48, borderRadius: 16, backgroundColor: C.soft, flexDirection: 'row', alignItems: 'center', gap: 10 },
  genBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 16 },
  promo: { marginHorizontal: 18, marginTop: 12, marginBottom: 14, padding: 12, borderRadius: R.card, flexDirection: 'row', gap: 14, alignItems: 'center', overflow: 'hidden', ...shadow(2) },
  promoThumb: { width: 72, height: 72, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  play: { position: 'absolute', right: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.kunyit, alignItems: 'center', justifyContent: 'center' },
  soon: { alignSelf: 'flex-start', backgroundColor: C.kunyit, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
});
