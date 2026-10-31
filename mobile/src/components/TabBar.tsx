import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow } from '../theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

const TABS: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Beranda', icon: 'home' },
  challenges: { label: 'Tantangan', icon: 'flag' },
  foods: { label: 'Makanan', icon: 'bowl' },
  profile: { label: 'Profil', icon: 'user' },
};

type Props = { state: { index: number; routes: { key: string; name: string }[] } };

/** Tab bar mengambang dengan tombol "Posting" menonjol di tengah (aksi utama komunitas). */
export function TabBar({ state }: Props) {
  const ins = useSafeAreaInsets();
  const items = state.routes.map((r, i) => ({ r, i, meta: TABS[r.name] })).filter((x) => x.meta);
  const half = Math.ceil(items.length / 2);

  const tab = ({ r, i, meta }: (typeof items)[number]) => {
    const on = state.index === i;
    return (
      <Pressable
        key={r.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={meta.label}
        onPress={() => {
          if (!on) router.navigate(`/${r.name}` as never);
        }}
        style={st.tab}
      >
        <View style={[st.iconWrap, on && { backgroundColor: C.soft }]}>
          <Icon name={meta.icon} size={22} color={on ? C.acc : C.muted} stroke={on ? 2.2 : 1.8} />
        </View>
        <Text style={{ fontSize: 10.5, fontWeight: on ? '800' : '600', color: on ? C.acc : C.muted }}>{meta.label}</Text>
      </Pressable>
    );
  };

  return (
    <View pointerEvents="box-none" style={[st.wrap, { paddingBottom: Math.max(ins.bottom, 10) }]}>
      <View style={st.bar}>
        {items.slice(0, half).map(tab)}
        <View style={{ width: 68 }} />
        {items.slice(half).map(tab)}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Buat postingan" onPress={() => router.push('/compose')} style={({ pressed }) => [st.fab, { bottom: Math.max(ins.bottom, 10) + 26 }, pressed && { transform: [{ scale: 0.94 }] }]}>
        <Icon name="plus" size={28} color="#fff" stroke={2.4} />
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, alignItems: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 26, height: 68, paddingHorizontal: 6, ...shadow(3) },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: 68 },
  iconWrap: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: C.acc, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: C.bg, ...shadow(3) },
});
