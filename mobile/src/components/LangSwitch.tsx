import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { invalidate } from '../lib/query';
import { Lang, useLang, useT } from '../i18n';
import { C } from '../theme';
import { Text } from './Text';

const OPTIONS: [Lang, string][] = [
  ['id', 'ID'],
  ['en', 'EN'],
];

/** Pilihan bahasa Indonesia / Inggris. `light` untuk dipasang di atas latar gelap. */
export function LangSwitch({ light, style }: { light?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useT();
  const { lang, setLang } = useLang();
  const pick = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    invalidate('/api/'); // muat ulang data dari server (tantangan, pesan) dalam bahasa baru
  };
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('Bahasa')} style={[st.wrap, light && st.wrapLight, style]}>
      {OPTIONS.map(([l, label]) => {
        const on = l === lang;
        return (
          <Pressable key={l} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={l === 'id' ? 'Bahasa Indonesia' : 'English'} onPress={() => pick(l)} style={[st.opt, on && (light ? st.onLight : st.on)]}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: on ? (light ? C.accDark : '#fff') : light ? 'rgba(255,255,255,0.85)' : C.muted }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', alignSelf: 'flex-start', padding: 3, borderRadius: 16, backgroundColor: C.lineSoft },
  wrapLight: { backgroundColor: 'rgba(255,255,255,0.18)' },
  opt: { minWidth: 44, height: 30, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  on: { backgroundColor: C.acc },
  onLight: { backgroundColor: '#fff' },
});
