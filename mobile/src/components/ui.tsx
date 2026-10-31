import { router } from 'expo-router';
import { AView } from './AView';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, PressableProps, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { C, R, T, TOUCH, shadow } from '../theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

/** Latar gradien diagonal. */
export function Grad({ from, to, style, children, angle = 'diag' }: { from: string; to: string; style?: StyleProp<ViewStyle>; children?: ReactNode; angle?: 'diag' | 'down' }) {
  const id = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2={angle === 'diag' ? '1' : '0'} y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

/** Pressable dengan umpan balik tekan (sedikit mengecil) — memberi rasa "fisik" pada elemen yang bisa diketuk. */
export function Tap({ style, children, scale = 0.97, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; children?: ReactNode; scale?: number }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [style, pressed && !rest.disabled && { transform: [{ scale }], opacity: 0.94 }]}>
      {children}
    </Pressable>
  );
}

export function Btn({
  title,
  onPress,
  disabled,
  variant = 'primary',
  loading,
  style,
  icon,
  small,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'kunyit';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
  small?: boolean;
}) {
  const v = {
    primary: { bg: disabled ? C.disabled : C.acc, fg: '#fff', extra: disabled ? null : shadow(2) },
    secondary: { bg: '#fff', fg: C.acc, extra: { borderWidth: 1.5, borderColor: C.acc } },
    ghost: { bg: C.soft, fg: C.accDark, extra: null },
    kunyit: { bg: C.kunyit, fg: C.ink, extra: shadow(2, '#8A5A00') },
  }[variant];
  return (
    <Tap
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[s.btn, small && { height: 46, borderRadius: 14 }, { backgroundColor: v.bg }, v.extra, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={19} color={v.fg} stroke={2.2} />}
          <Text style={[s.btnTxt, small && { fontSize: 14.5 }, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Tap>
  );
}

export function LinkBtn({ title, onPress, muted, style }: { title: string; onPress: () => void; muted?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[{ minHeight: TOUCH, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }, style]}>
      <Text style={{ color: muted ? C.muted : C.acc, fontWeight: '700', fontSize: 14 }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, style, emoji }: { label: string; on?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; emoji?: string }) {
  return (
    <Tap accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress} style={[s.chip, on ? { backgroundColor: C.ink, borderColor: C.ink, ...shadow(1) } : null, style]}>
      {emoji ? <Text style={{ fontSize: 14 }}>{emoji}</Text> : null}
      <Text style={{ fontWeight: '700', fontSize: 13, color: on ? '#fff' : C.ink }}>{label}</Text>
    </Tap>
  );
}

/** Kartu. level 0 = datar (dalam grup), 1 = standar, 2 = menonjol. */
export function Card({ children, style, level = 1 }: { children: ReactNode; style?: StyleProp<ViewStyle>; level?: 0 | 1 | 2 }) {
  return <View style={[s.card, level > 0 ? shadow(level as 1 | 2) : { borderWidth: 1, borderColor: C.line }, style]}>{children}</View>;
}

export function Pill({ label, tone = 'g', style, emoji }: { label: string; tone?: 'g' | 'a' | 'dark' | 'light'; style?: StyleProp<ViewStyle>; emoji?: string }) {
  const t = { g: [C.soft, C.accDark], a: [C.amber, C.amberInk], dark: [C.ink, '#fff'], light: ['rgba(255,255,255,0.18)', '#fff'] }[tone];
  return (
    <View style={[s.pill, { backgroundColor: t[0] }, style]}>
      {emoji ? <Text style={{ fontSize: 11 }}>{emoji}</Text> : null}
      <Text style={{ fontSize: 11.5, fontWeight: '700', color: t[1] }}>{label}</Text>
    </View>
  );
}

const TONES = {
  amber: { bg: '#FFE7B3', fg: C.amberInk },
  green: { bg: C.mint, fg: C.accDark },
  blue: { bg: '#D6E4F7', fg: '#244A7A' },
  me: { bg: C.acc, fg: '#fff' },
};
export function Avatar({ ini, tone = 'green', size = 36, ring }: { ini: string; tone?: keyof typeof TONES; size?: number; ring?: boolean }) {
  const t = TONES[tone];
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }, ring && { borderWidth: 2.5, borderColor: '#fff', ...shadow(1) }]}>
      <Text style={{ color: t.fg, fontWeight: '800', fontSize: size * 0.36 }}>{ini}</Text>
    </View>
  );
}

export function IconBtn({ name, onPress, label, style, color = C.ink, size = 21 }: { name: IconName; onPress: () => void; label: string; style?: StyleProp<ViewStyle>; color?: string; size?: number }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} scale={0.92} style={[s.ibtn, style]}>
      <Icon name={name} size={size} color={color} />
    </Tap>
  );
}

/** Header layar: tombol kembali (opsional), judul, aksi kanan. */
export function Bar({ title, hi, back, close, right, titleStyle }: { title: string; hi?: string; back?: boolean; close?: boolean; right?: ReactNode; titleStyle?: StyleProp<TextStyle> }) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={s.bar}>
      {(back || close) && <IconBtn name={close ? 'close' : 'back'} label={close ? 'Tutup' : 'Kembali'} onPress={goBack} size={20} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        {hi ? <Text style={{ fontSize: 13, color: C.muted, fontWeight: '500' }}>{hi}</Text> : null}
        <Text style={[s.barTitle, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

/** Header untuk layar turunan: kembali, judul di tengah, ruang aksi. */
export function SubBar({ title, onBack, right, backLabel = 'Kembali', icon = 'back' }: { title: string; onBack: () => void; right?: ReactNode; backLabel?: string; icon?: IconName }) {
  return (
    <View style={[s.bar, { justifyContent: 'space-between' }]}>
      <IconBtn name={icon} label={backLabel} size={20} onPress={onBack} />
      <Text style={{ ...T.h3, color: C.ink }} numberOfLines={1}>
        {title}
      </Text>
      {right ?? <View style={{ width: TOUCH }} />}
    </View>
  );
}

export function Empty({ title, body, action, emoji = '🍽️' }: { title: string; body: string; action?: { label: string; onPress: () => void }; emoji?: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Text style={{ fontSize: 30 }}>{emoji}</Text>
      </View>
      <Text style={{ ...T.h3, color: C.ink, marginBottom: 4, textAlign: 'center' }}>{title}</Text>
      <Text style={{ ...T.body, color: C.muted, textAlign: 'center', fontSize: 14 }}>{body}</Text>
      {action && <Btn title={action.label} onPress={action.onPress} small style={{ marginTop: 16, paddingHorizontal: 22 }} />}
    </View>
  );
}

/** Kontrol segmen untuk pilihan tunggal (radio). */
export function Seg<T extends string | number>({ options, value, onChange, label }: { options: [string, T][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={s.seg}>
      {options.map(([l, v]) => {
        const on = v === value;
        return (
          <Pressable key={String(v)} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => onChange(v)} style={[s.segBtn, on && [s.segOn, shadow(1)]]}>
            <Text style={{ fontSize: 14, fontWeight: on ? '800' : '600', color: on ? C.ink : C.muted }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Baris pilihan radio besar. */
export function RadioRow({ on, onPress, title, sub, right, style, emoji }: { on: boolean; onPress?: () => void; title: string; sub?: string; right?: string; style?: StyleProp<ViewStyle>; emoji?: string }) {
  return (
    <Tap accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={[s.radio, on ? { borderColor: C.acc, backgroundColor: '#F4FBF7', ...shadow(1) } : null, style]}>
      {emoji ? <Text style={{ fontSize: 22 }}>{emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.ink }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 12.5, color: C.muted }}>{sub}</Text> : null}
      </View>
      {right ? <Text style={{ fontSize: 13, color: C.muted }}>{right}</Text> : null}
      <View style={[s.dot, on && { backgroundColor: C.acc, borderColor: C.acc }]}>{on && <Icon name="check" size={12} color="#fff" stroke={3.4} />}</View>
    </Tap>
  );
}

/** Daftar manfaat dengan centang. */
export function Benefits({ items, light }: { items: [string, string?][]; light?: boolean }) {
  return (
    <View style={{ gap: 12, marginVertical: 14 }}>
      {items.map(([b, sm]) => (
        <View key={b} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: light ? 'rgba(255,255,255,0.18)' : C.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={13} color={light ? '#fff' : C.acc} stroke={3.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '700', color: light ? '#fff' : C.ink }}>{b}</Text>
            {sm ? <Text style={{ fontSize: 12.5, color: light ? 'rgba(255,255,255,0.8)' : C.muted, lineHeight: 18 }}>{sm}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Blok abu-abu berdenyut sebagai pengganti konten yang sedang dimuat (terasa lebih cepat dari spinner). */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <AView style={[{ backgroundColor: '#DCE8E1', borderRadius: 10, opacity: a }, style]} />;
}

/** Kartu kerangka untuk daftar postingan. */
export function PostSkeleton() {
  return (
    <View style={[s.card, shadow(1), { padding: 14, gap: 10, marginHorizontal: 18 }]}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Skeleton style={{ width: 38, height: 38, borderRadius: 19 }} />
        <View style={{ gap: 6, flex: 1 }}>
          <Skeleton style={{ width: '40%', height: 12 }} />
          <Skeleton style={{ width: '25%', height: 10 }} />
        </View>
      </View>
      <Skeleton style={{ height: 120, borderRadius: 16 }} />
      <Skeleton style={{ width: '90%', height: 12 }} />
      <Skeleton style={{ width: '70%', height: 12 }} />
    </View>
  );
}

/** Status memuat / error untuk data dari server. */
export function QueryState({ loading, error, onRetry, empty, skeleton }: { loading?: boolean; error?: string; onRetry?: () => void; empty?: ReactNode; skeleton?: ReactNode }) {
  if (error)
    return (
      <View style={[s.empty, { borderColor: '#F0C9C6' }]}>
        <View style={[s.emptyIcon, { backgroundColor: '#FDECEC' }]}>
          <Text style={{ fontSize: 28 }}>📡</Text>
        </View>
        <Text style={{ ...T.h3, color: C.ink, marginBottom: 4, textAlign: 'center' }}>Gagal memuat</Text>
        <Text style={{ color: C.muted, textAlign: 'center', lineHeight: 21 }}>{error}</Text>
        {onRetry && <Btn title="Coba lagi" small variant="secondary" onPress={onRetry} style={{ marginTop: 14, paddingHorizontal: 24 }} />}
      </View>
    );
  if (loading)
    return (
      skeleton ?? (
        <View style={{ padding: 18, gap: 12 }}>
          <Skeleton style={{ height: 70, borderRadius: R.tile }} />
          <Skeleton style={{ height: 70, borderRadius: R.tile }} />
          <Skeleton style={{ height: 70, borderRadius: R.tile }} />
        </View>
      )
    );
  return <>{empty ?? null}</>;
}

/** Judul bagian dengan aksi opsional di kanan. */
export function Section({ title, action, style }: { title: string; action?: { label: string; onPress: () => void }; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, style]}>
      <Text style={{ ...T.h2, color: C.ink }}>{title}</Text>
      {action && <LinkBtn title={action.label} onPress={action.onPress} style={{ paddingHorizontal: 0 }} />}
    </View>
  );
}

export const Small = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[{ fontSize: 12, lineHeight: 17, color: C.muted, fontWeight: '500' }, style]}>{children}</Text>;

export const s = StyleSheet.create({
  btn: { height: 54, borderRadius: R.btn, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  btnSec: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.acc },
  btnTxt: { fontWeight: '800', fontSize: 16 },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: R.chip, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', alignItems: 'center', flexDirection: 'row', gap: 6 },
  card: { backgroundColor: C.card, borderRadius: R.card },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  ibtn: { width: TOUCH, height: TOUCH, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow(1) },
  bar: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTitle: { ...T.h1, color: C.ink },
  empty: { marginHorizontal: 18, marginVertical: 20, padding: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.dashed, borderRadius: R.card, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  seg: { flexDirection: 'row', backgroundColor: '#E2ECE6', borderRadius: 16, padding: 4 },
  segBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: '#fff' },
  radio: { minHeight: 62, paddingHorizontal: 16, paddingVertical: 10, borderRadius: R.tile, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.dashed, alignItems: 'center', justifyContent: 'center' },
  h2: { ...T.h2, color: C.ink, marginTop: 18, marginBottom: 8 },
  label: { fontSize: 13.5, fontWeight: '700', color: C.ink, marginTop: 16, marginBottom: 8 },
  field: { borderWidth: 1.5, borderColor: C.line, borderRadius: R.input, padding: 14, fontSize: 15, color: C.ink, backgroundColor: '#fff', textAlignVertical: 'top' },
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { paddingHorizontal: 18 },
});
