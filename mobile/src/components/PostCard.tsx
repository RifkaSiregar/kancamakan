import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { mutateAll } from '../lib/query';
import type { Post } from '../lib/types';
import { api, fileUrl } from '../services/api';
import { ago, toast, toastError } from '../store';
import { C, R, TOPIC_EMOJI, TOPIC_TINT, foodEmoji, shadow } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { Avatar, Grad, Tap } from './ui';

/** Perbarui satu postingan di semua daftar yang sedang di-cache. */
export function patchPost(p: Post) {
  mutateAll<{ posts?: Post[]; post?: Post }>('/api/posts', (d) => ({
    ...d,
    ...(d.posts ? { posts: d.posts.map((x) => (x.id === p.id ? p : x)) } : {}),
    ...(d.post && d.post.id === p.id ? { post: p } : {}),
  }));
}

const KIND_STYLE = {
  Tanya: { bg: '#FFF2CF', fg: '#6B4A00', label: 'Tanya' },
  Resep: { bg: '#E8E4FB', fg: '#3F3290', label: 'Resep' },
} as const;

export function PostCard({ p }: { p: Post }) {
  const open = () => router.push({ pathname: '/post/[id]', params: { id: String(p.id) } });
  const photo = fileUrl(p.photo);
  const tint = TOPIC_TINT[p.topic] ?? ['#E1F3E9', '#BFE0CF'];
  const kind = p.kind !== 'Bagikan' ? KIND_STYLE[p.kind] : null;

  const toggle = async (what: 'like' | 'save') => {
    const optimistic = what === 'like' ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : { ...p, saved: !p.saved };
    patchPost(optimistic);
    if (what === 'save') toast(p.saved ? 'Dihapus dari simpanan' : 'Postingan disimpan');
    try {
      const r = await api.post<{ post: Post }>(`/api/posts/${p.id}/${what}`);
      patchPost(r.post);
    } catch (e) {
      patchPost(p);
      toastError(e);
    }
  };

  return (
    <View style={st.card}>
      <View style={st.head}>
        {p.author.bot ? (
          <Grad from={C.accBright} to={C.acc} style={st.botAv}>
            <Icon name="spark" size={18} color="#fff" stroke={2} />
          </Grad>
        ) : (
          <Avatar ini={p.author.initials} tone={p.mine ? 'me' : p.author.tone ?? 'green'} size={40} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '800', color: C.ink, flexShrink: 1 }} numberOfLines={1}>
              {p.mine ? 'Kamu' : p.author.name}
            </Text>
            {p.author.bot && (
              <View style={st.botTag}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: C.accDark }}>{p.ai ? 'AI' : 'Tips'}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '500' }}>{ago(p.createdAt)}</Text>
        </View>
        {kind && (
          <View style={[st.kind, { backgroundColor: kind.bg }]}>
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: kind.fg }}>{kind.label}</Text>
          </View>
        )}
      </View>

      <Tap accessibilityRole="button" accessibilityLabel={`Buka postingan ${p.food?.label ?? p.topic}`} onPress={open} scale={0.985}>
        {photo ? (
          <View style={st.photo}>
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={st.topicOnPhoto}>
              <Text style={{ fontSize: 12 }}>{TOPIC_EMOJI[p.topic] ?? '🍽️'}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.ink }}>{p.topic}</Text>
            </View>
          </View>
        ) : (
          <Grad from={tint[0]} to={tint[1]} style={st.banner}>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={st.topicPill}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.ink }}>{p.topic}</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.2 }} numberOfLines={2}>
                {p.food?.label || (p.kind === 'Tanya' ? 'Pertanyaan untuk komunitas' : p.topic)}
              </Text>
            </View>
            <View style={st.emojiBubble}>
              <Text style={{ fontSize: 34 }}>{p.food?.id ? foodEmoji(p.food.name, p.food.category) : TOPIC_EMOJI[p.topic] || '🍽️'}</Text>
            </View>
          </Grad>
        )}
        <Text style={st.txt}>{p.text}</Text>
      </Tap>

      {p.food?.id && (
        <Tap accessibilityRole="button" accessibilityLabel={`Lihat info gizi ${p.food.name ?? p.food.label}`} onPress={() => router.push({ pathname: '/food/[id]', params: { id: p.food!.id! } })} style={st.foodChip}>
          <Icon name="bowl" size={15} color={C.accDark} stroke={2.2} />
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.accDark }}>Info gizi {p.food.name ?? p.food.label}</Text>
          <Icon name="chev" size={13} color={C.accDark} stroke={2.4} />
        </Tap>
      )}

      <View style={st.acts}>
        <Pressable accessibilityRole="button" accessibilityLabel="Suka" accessibilityState={{ selected: p.liked }} onPress={() => toggle('like')} style={[st.act, p.liked && { backgroundColor: '#FDECEC' }]}>
          <Icon name="heart" size={19} color={p.liked ? C.heart : C.muted} fill={p.liked ? C.heart : 'none'} stroke={2} />
          <Text style={[st.actTxt, p.liked && { color: C.heart }]}>{p.likes}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Komentar" onPress={open} style={st.act}>
          <Icon name="msg" size={19} color={C.muted} stroke={2} />
          <Text style={st.actTxt}>{p.comments}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Simpan" accessibilityState={{ selected: p.saved }} onPress={() => toggle('save')} style={[st.act, p.saved && { backgroundColor: C.soft }]}>
          <Icon name="book" size={19} color={p.saved ? C.acc : C.muted} fill={p.saved ? C.acc : 'none'} stroke={2} />
          <Text style={[st.actTxt, p.saved && { color: C.acc }]}>{p.saved ? 'Tersimpan' : 'Simpan'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: R.card, padding: 12, ...shadow(1) },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2, paddingBottom: 10 },
  botAv: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  botTag: { backgroundColor: C.soft, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  kind: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  photo: { height: 190, borderRadius: R.tile, overflow: 'hidden', backgroundColor: C.soft, justifyContent: 'flex-end', padding: 10 },
  topicOnPhoto: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  banner: { borderRadius: R.tile, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 104 },
  topicPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  emojiBubble: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  txt: { paddingHorizontal: 4, paddingTop: 12, fontSize: 14.5, lineHeight: 22, color: C.ink },
  foodChip: { marginHorizontal: 4, marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.soft, borderRadius: 12, paddingHorizontal: 10, minHeight: 34 },
  acts: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: C.lineSoft },
  act: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 10, borderRadius: 20 },
  actTxt: { fontSize: 13, fontWeight: '700', color: C.muted },
});
