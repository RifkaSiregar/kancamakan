import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { Avatar, Empty, QueryState, SubBar, Tap, s } from '../components/ui';
import { invalidate, useQuery } from '../lib/query';
import type { AppNotification } from '../lib/types';
import { api } from '../services/api';
import { ago } from '../store';
import { C, R, shadow } from '../theme';

const ICON: Record<string, string> = { comment: '💬', reply: '💬', like: '❤️' };

/** Kotak notifikasi: tanggapan dan suka dari anggota komunitas. */
export default function NotificationsScreen() {
  const q = useQuery<{ notifications: AppNotification[]; unread: number }>('/api/notifications');
  const list = q.data?.notifications ?? [];

  // Tandai semua terbaca setelah dibuka (tampilan tetap menyorot yang baru sampai layar ditutup).
  useEffect(() => {
    if (!q.data?.unread) return;
    api.post('/api/notifications/read').then(() => invalidate('/api/me')).catch(() => {});
  }, [q.data?.unread]);

  return (
    <SafeAreaView style={s.screen}>
      <SubBar title="Notifikasi" onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
      <FlatList
        data={list}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 18, paddingTop: 6, gap: 10 }}
        refreshing={false}
        onRefresh={q.refresh}
        renderItem={({ item: n }) => (
          <Tap accessibilityRole="button" disabled={!n.postId} onPress={() => n.postId && router.push({ pathname: '/post/[id]', params: { id: String(n.postId) } })} style={[st.row, !n.read && st.unread]} scale={0.98}>
            <View>
              <Avatar ini={n.actor?.initials ?? '?'} tone="green" size={42} />
              <View style={st.badge}>
                <Text style={{ fontSize: 11 }}>{ICON[n.type] ?? '🔔'}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, lineHeight: 20, color: C.ink, fontWeight: n.read ? '500' : '700' }}>{n.text}</Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{ago(n.createdAt)}</Text>
            </View>
            {!n.read && <View style={st.dot} />}
          </Tap>
        )}
        ListEmptyComponent={<QueryState loading={q.loading} error={q.error} onRetry={q.refresh} empty={<Empty emoji="🔔" title="Belum ada notifikasi" body="Saat ada yang menanggapi atau menyukai postinganmu, kabarnya muncul di sini." />} />}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.tile, backgroundColor: '#fff', ...shadow(1) },
  unread: { backgroundColor: '#F4FBF7', borderWidth: 1.5, borderColor: C.mint },
  badge: { position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow(1) },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.heart },
});
