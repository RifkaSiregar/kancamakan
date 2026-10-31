import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Sheet, SheetOpt } from '../components/Sheet';
import { Btn, Chip, IconBtn, Seg, Small, s } from '../components/ui';
import { TOPICS } from '../data/sample';
import { FEEDS, invalidate, useQuery } from '../lib/query';
import type { Food, Kind } from '../lib/types';
import { api, qs } from '../services/api';
import { toast, toastError, useApp } from '../store';
import { C, TOPIC_EMOJI, foodEmoji, shadow } from '../theme';

type Photo = { uri: string; base64: string; type: string };

export default function Compose() {
  const params = useLocalSearchParams<{ type?: Kind; foodId?: string; foodLabel?: string; topic?: string }>();
  const myTopics = useApp((st) => st.user?.topics ?? []);
  const [kind, setKind] = useState<Kind>(params.type ?? 'Bagikan');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState(params.topic && TOPICS.includes(params.topic) ? params.topic : myTopics.find((t) => TOPICS.includes(t)) ?? TOPICS[0]);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [food, setFood] = useState<{ id: string | null; label: string } | null>(params.foodId ? { id: params.foodId, label: params.foodLabel ?? '' } : null);
  const [pickMenu, setPickMenu] = useState(false);
  const [foodSheet, setFoodSheet] = useState(false);
  const [fq, setFq] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const foods = useQuery<{ foods: Food[] }>(foodSheet ? `/api/foods${qs({ q: fq.trim(), limit: 30 })}` : null);
  const ok = text.trim().length >= 3;
  const MIN_AI = 8;
  const canAi = text.trim().length >= MIN_AI && !aiBusy;

  const pick = async (camera: boolean) => {
    setPickMenu(false);
    await new Promise((r) => setTimeout(r, 350)); // tunggu sheet tertutup (iOS tidak bisa membuka 2 modal sekaligus)
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast(camera ? 'Izin kamera ditolak. Aktifkan di pengaturan.' : 'Izin galeri ditolak. Aktifkan di pengaturan.');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, allowsEditing: true, aspect: [4, 3], base64: true };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const a = r.canceled ? null : r.assets[0];
    if (!a?.base64) return;
    const type = a.mimeType && ['image/jpeg', 'image/png', 'image/webp'].includes(a.mimeType) ? a.mimeType : 'image/jpeg';
    if (a.base64.length > 4_000_000) return toast('Foto terlalu besar. Pilih foto lain.');
    setPhoto({ uri: a.uri, base64: a.base64, type });
  };

  const assist = async () => {
    const before = text;
    setAiBusy(true);
    try {
      const d = await api.post<{ text: string; food_label: string; food_id: string | null }>('/api/ai/draft', { kind, topic, hint: text }, 45000);
      setText(d.text.slice(0, 280));
      if (d.food_id && !food) setFood({ id: d.food_id, label: d.food_label });
      toast('Tulisanmu sudah dirapikan. Periksa dulu ya.', { label: 'Urungkan', run: () => setText(before) });
    } catch (e) {
      toastError(e, 'AI gagal membuat tulisan');
    } finally {
      setAiBusy(false);
    }
  };

  const post = async () => {
    setSending(true);
    try {
      await api.post(
        '/api/posts',
        { kind, topic, text: text.trim(), foodId: food?.id ?? undefined, foodLabel: food?.label ?? (kind === 'Tanya' ? 'Pertanyaan' : kind === 'Resep' ? 'Resep' : ''), photo: photo?.base64, photoType: photo?.type },
        60000,
      );
      invalidate(FEEDS);
      invalidate('/api/me');
      toast('Terkirim ke komunitas');
      router.canGoBack() ? router.back() : router.replace('/home');
    } catch (e) {
      toastError(e, 'Gagal mengirim');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.bar, { justifyContent: 'space-between' }]}>
          <IconBtn name="close" label="Tutup" size={20} onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>Postingan baru</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
          <Seg
            label="Jenis"
            value={kind}
            onChange={setKind}
            options={[
              ['Bagikan', 'Bagikan'],
              ['Tanya', 'Tanya'],
              ['Resep', 'Resep'],
            ]}
          />

          {photo ? (
            <View style={st.photo}>
              <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} />
              <Pressable onPress={() => setPickMenu(true)} style={st.change} accessibilityRole="button">
                <Text style={{ fontWeight: '600', fontSize: 13, color: C.ink }}>Ganti</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setPickMenu(true)} style={st.add}>
              <Icon name="cam" size={30} color={C.acc} />
              <Text style={{ fontWeight: '600', fontSize: 14, color: '#3E4F45' }}>Tambah foto makanan (opsional)</Text>
            </Pressable>
          )}

          <Text style={s.label}>{kind === 'Tanya' ? 'Apa yang ingin kamu tanyakan?' : kind === 'Resep' ? 'Tulis resepmu' : 'Ceritakan makananmu'}</Text>
          <TextInput value={text} onChangeText={setText} editable={!aiBusy} multiline maxLength={280} placeholder="Apa yang kamu makan, atau apa yang ingin kamu tanyakan?" style={[s.field, { minHeight: 110, borderColor: 'transparent', ...shadow(1) }]} accessibilityLabel="Isi postingan" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rapikan dengan AI"
              accessibilityState={{ disabled: !canAi, busy: aiBusy }}
              accessibilityHint={canAi ? undefined : `Tulis minimal ${MIN_AI} huruf dulu`}
              disabled={!canAi}
              onPress={assist}
              style={[st.ai, !canAi && st.aiOff]}
            >
              {aiBusy ? <ActivityIndicator size="small" color={C.ink} /> : <Icon name="spark" size={16} color={canAi ? C.ink : C.muted} stroke={2.2} />}
              <Text style={{ fontWeight: '800', fontSize: 13, color: canAi || aiBusy ? C.ink : C.muted }}>{aiBusy ? 'AI sedang merapikan…' : 'Rapikan dengan AI'}</Text>
            </Pressable>
            <Small>{text.length}/280</Small>
          </View>
          {!canAi && !aiBusy && <Small style={{ marginTop: 6 }}>Tulis dulu ceritamu dengan kata-katamu sendiri, lalu AI bisa bantu merapikan dan melengkapinya.</Small>}

          <Text style={s.label}>Makanan (opsional)</Text>
          {/* Baris tag makanan: area utama dan tombol hapus dibuat bersebelahan (tidak bersarang) */}
          <View style={st.foodRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Pilih makanan dari database" onPress={() => setFoodSheet(true)} style={st.foodMain}>
              {food ? <Text style={{ fontSize: 20 }}>{foodEmoji(food.label)}</Text> : <Icon name="bowl" size={18} color={C.acc} stroke={2} />}
              <Text style={{ flex: 1, fontSize: 14.5, color: food ? C.ink : C.muted, fontWeight: food ? '700' : '400' }} numberOfLines={1}>
                {food ? food.label : 'Tag makanan dari database'}
              </Text>
              {!food && <Icon name="chev" size={16} color={C.muted} />}
            </Pressable>
            {food && (
              <Pressable accessibilityRole="button" accessibilityLabel="Hapus tag makanan" onPress={() => setFood(null)} hitSlop={8} style={st.foodClear}>
                <Icon name="close" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>

          <Text style={{ marginTop: 14, marginBottom: 8, fontSize: 13, fontWeight: '700', color: C.ink }}>Topik</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TOPICS.map((t) => (
              <Chip key={t} label={t} emoji={TOPIC_EMOJI[t]} on={topic === t} onPress={() => setTopic(t)} />
            ))}
          </View>
          <Small style={{ marginTop: 12 }}>Jangan menulis angka berat badan ekstrem atau saran diet berbahaya. Postingan seperti itu akan ditolak atau dihapus. Kamu bisa melaporkan postingan yang melanggar.</Small>
        </ScrollView>
        <View style={{ paddingHorizontal: 18, paddingBottom: 16 }}>
          <Btn title="Kirim ke komunitas" disabled={!ok} loading={sending} onPress={post} />
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={pickMenu} onClose={() => setPickMenu(false)} title="Tambah foto">
        <SheetOpt label="Ambil dari kamera" onPress={() => pick(true)} />
        <SheetOpt label="Pilih dari galeri" onPress={() => pick(false)} />
        {photo && (
          <SheetOpt
            label="Hapus foto"
            danger
            onPress={() => {
              setPhoto(null);
              setPickMenu(false);
            }}
          />
        )}
        <SheetOpt label="Batal" muted onPress={() => setPickMenu(false)} />
      </Sheet>

      <Sheet visible={foodSheet} onClose={() => setFoodSheet(false)} title="Pilih makanan">
        <TextInput value={fq} onChangeText={setFq} placeholder="Cari, misalnya tempe" style={[s.field, { height: 46, marginBottom: 8 }]} autoFocus accessibilityLabel="Cari makanan" />
        <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
          {foods.loading && !foods.data ? <ActivityIndicator color={C.acc} style={{ margin: 16 }} /> : null}
          {(foods.data?.foods ?? []).slice(0, 30).map((f) => (
            <SheetOpt
              key={f.id}
              label={f.name}
              right={f.source === 'CalMates' ? f.category : `${f.source} · per 100 g`}
              onPress={() => {
                setFood({ id: f.id, label: f.name });
                setFoodSheet(false);
                setFq('');
              }}
            />
          ))}
          {fq.trim().length > 1 && foods.data && !foods.data.foods.length && (
            <SheetOpt
              label={`Pakai "${fq.trim()}" tanpa data gizi`}
              onPress={() => {
                setFood({ id: null, label: fq.trim().slice(0, 40) });
                setFoodSheet(false);
                setFq('');
              }}
            />
          )}
        </ScrollView>
      </Sheet>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  add: { marginTop: 14, height: 120, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#9FD9B4', backgroundColor: '#F4FBF7', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photo: { marginTop: 12, height: 160, borderRadius: 18, overflow: 'hidden', backgroundColor: C.soft },
  ai: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.kunyit, ...shadow(1, '#8A5A00') },
  aiOff: { backgroundColor: '#E6ECE8', shadowOpacity: 0, elevation: 0, boxShadow: 'none' } as never,
  foodRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: 16, backgroundColor: '#fff', ...shadow(1) },
  foodMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14 },
  foodClear: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  change: { position: 'absolute', right: 8, top: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22, height: 40, paddingHorizontal: 14, justifyContent: 'center' },
});
