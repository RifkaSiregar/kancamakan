import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { Avatar, Btn, Card, Chip, Grad, QueryState, Skeleton, Small, s } from '../../components/ui';
import { mutate, useQuery } from '../../lib/query';
import type { ChallengeWeek } from '../../lib/types';
import { api } from '../../services/api';
import { thisWeek, toast, toastError, todayKey } from '../../store';
import { C, R, T, shadow } from '../../theme';

const CH_EMOJI: Record<string, string> = { 'sarapan-protein': '🍳', 'tanpa-minuman-manis': '🥤', 'tambah-sayur': '🥬', 'jalan-kaki': '🚶' };
const MEDAL = ['🥇', '🥈', '🥉'];

export default function Challenges() {
  const week = thisWeek();
  const key = `/api/challenges/current?from=${week[0].key}`;
  const q = useQuery<ChallengeWeek>(key);
  const [busy, setBusy] = useState(false);
  const d = q.data;

  const header = (
    <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 }}>
      <Text style={{ ...T.h1, color: C.ink }}>Tantangan mingguan</Text>
      <Text style={{ ...T.small, color: C.muted, marginTop: 2 }}>Satu kebiasaan kecil, check-in sekali sehari</Text>
    </View>
  );

  if (!d) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        {header}
        <QueryState loading={q.loading} error={q.error} onRetry={q.refresh} skeleton={<View style={{ padding: 18, gap: 14 }}><Skeleton style={{ height: 300, borderRadius: R.hero }} /><Skeleton style={{ height: 160, borderRadius: R.card }} /></View>} />
      </SafeAreaView>
    );
  }

  const done = d.days.length;
  const checkedToday = d.days.includes(todayKey());
  // Hari berturut-turut sampai hari ini (atau kemarin bila hari ini belum).
  let streak = 0;
  for (let i = week.findIndex((w) => w.isToday) - (checkedToday ? 0 : 1); i >= 0 && d.days.includes(week[i].key); i--) streak++;

  const checkIn = async () => {
    setBusy(true);
    try {
      await api.post(`/api/challenges/${d.current.id}/checkin`, { day: todayKey() });
      await q.refresh();
      toast(`Check-in tercatat. ${done + 1} dari 7 hari 🎉`, { label: 'Bagikan', run: () => router.push({ pathname: '/compose', params: { type: 'Bagikan' } }) });
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const remind = async () => {
    try {
      const r = await api.post<{ remind: boolean }>(`/api/challenges/${d.next.id}/remind`);
      mutate<ChallengeWeek>(key, (x) => ({ ...x, remind: r.remind }));
      toast(r.remind ? 'Kami ingatkan saat tantangan dimulai' : 'Pengingat dimatikan');
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} refreshControl={<RefreshControl refreshing={q.loading} onRefresh={q.refresh} />}>
        {header}
        <View style={{ paddingHorizontal: 18, gap: 14, marginTop: 8 }}>
          <Grad from="#178A60" to="#0B5139" style={st.hero}>
            <View style={st.blob} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={st.emoji}>
                <Text style={{ fontSize: 30 }}>{CH_EMOJI[d.current.id] ?? '🏁'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#BFEBD3' }}>Minggu ini · {d.participants} peserta</Text>
                <Text style={{ fontSize: 21, lineHeight: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>{d.current.title}</Text>
              </View>
            </View>
            <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.85)' }}>{d.current.body}</Text>

            <View style={st.days}>
              {week.map((w) => {
                const c = d.days.includes(w.key);
                return (
                  <View key={w.key} style={{ alignItems: 'center', gap: 6 }} accessibilityLabel={`${w.label}${c ? ', selesai' : w.isToday ? ', hari ini' : ''}`}>
                    <View style={[st.day, c && st.dayDone, !c && w.isToday && st.dayToday, w.future && { opacity: 0.5 }]}>
                      {c ? <Icon name="check" size={16} color={C.ink} stroke={3.2} /> : <Text style={{ fontSize: 12, fontWeight: '800', color: w.isToday ? '#fff' : 'rgba(255,255,255,0.7)' }}>{w.key.slice(-2).replace(/^0/, '')}</Text>}
                    </View>
                    <Text style={{ fontSize: 11, color: w.isToday ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: w.isToday ? '800' : '600' }}>{w.label}</Text>
                  </View>
                );
              })}
            </View>

            <View style={st.statsRow}>
              <View style={st.stat}>
                <Text style={st.statNum}>{done}/7</Text>
                <Text style={st.statLbl}>hari selesai</Text>
              </View>
              <View style={st.stat}>
                <Text style={st.statNum}>🔥 {streak}</Text>
                <Text style={st.statLbl}>hari beruntun</Text>
              </View>
            </View>

            {checkedToday ? (
              <View style={st.doneBox} accessibilityLiveRegion="polite">
                <View style={st.doneIcon}>
                  <Icon name="check" size={16} color={C.ink} stroke={3.2} />
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: '#fff' }}>Sudah check-in hari ini</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' }}>Sampai besok!</Text>
              </View>
            ) : (
              <Btn title="Check-in hari ini" variant="kunyit" loading={busy} onPress={checkIn} style={{ marginTop: 16 }} />
            )}
          </Grad>

          <Card style={{ padding: 16 }}>
            <Text style={{ ...T.h2, color: C.ink, marginBottom: 8 }}>Papan check-in</Text>
            {d.board.length ? (
              d.board.map((b, i) => (
                <View key={`${b.name}-${i}`} style={[st.rank, b.me && st.rankMe, i > 0 && !b.me && !d.board[i - 1]?.me && { borderTopWidth: 1, borderTopColor: C.lineSoft }]}>
                  <Text style={{ width: 28, fontSize: i < 3 ? 20 : 14, fontWeight: '800', color: C.muted, textAlign: 'center' }}>{MEDAL[i] ?? i + 1}</Text>
                  <Avatar ini={b.initials} tone={b.me ? 'me' : 'green'} size={34} />
                  <Text style={{ flex: 1, fontWeight: b.me ? '800' : '600', color: C.ink, fontSize: 14.5 }}>{b.me ? `Kamu` : b.name}</Text>
                  <View style={st.daysPill}>
                    <Text style={{ fontWeight: '800', color: C.accDark, fontSize: 13 }}>{b.days} hari</Text>
                  </View>
                </View>
              ))
            ) : (
              <Small>Belum ada yang check-in minggu ini. Jadilah yang pertama!</Small>
            )}
          </Card>

          <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[st.emoji, { backgroundColor: C.amber, width: 48, height: 48 }]}>
              <Text style={{ fontSize: 24 }}>{CH_EMOJI[d.next.id] ?? '⏭️'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Small>Minggu depan</Small>
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.ink }}>{d.next.title}</Text>
            </View>
            <Chip label={d.remind ? 'Diingatkan' : 'Ingatkan'} emoji={d.remind ? '🔔' : undefined} on={d.remind} onPress={remind} />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  hero: { borderRadius: R.hero, padding: 18, overflow: 'hidden', ...shadow(3) },
  blob: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(245,184,46,0.14)', top: -80, right: -60 },
  emoji: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  day: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  dayDone: { backgroundColor: C.kunyit, borderColor: C.kunyit },
  dayToday: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.14)' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  doneBox: { marginTop: 16, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  doneIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.kunyit, alignItems: 'center', justifyContent: 'center' },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54 },
  rankMe: { backgroundColor: '#F4FBF7', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 14 },
  daysPill: { backgroundColor: C.soft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
});
