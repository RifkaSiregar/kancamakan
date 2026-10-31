import { useEffect, useRef } from 'react';
import { AView } from './AView';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Svg, { Circle, CircleProps } from 'react-native-svg';
import { C } from '../theme';

// Buang `collapsable` (ditambahkan Animated) agar tidak diteruskan ke elemen <circle> di web.
function PlainCircle({ collapsable: _c, ...rest }: CircleProps & { collapsable?: boolean }) {
  return <Circle {...rest} />;
}
const AnimatedCircle = Animated.createAnimatedComponent(PlainCircle);
const CIRC = 2 * Math.PI * 54; // 339.3

/** Cincin sisa kalori. */
export function Ring({ eaten, target, size = 128 }: { eaten: number; target: number; size?: number }) {
  const rem = target - eaten;
  const pct = Math.min(1, Math.max(0, eaten / target));
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct, a]);
  const offset = a.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });
  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`${Math.abs(rem)} kkal ${rem < 0 ? 'lebih' : 'tersisa'}`}>
      <Svg width={size} height={size} viewBox="0 0 132 132">
        <Circle cx={66} cy={66} r={54} fill="none" stroke={C.soft} strokeWidth={12} />
        <AnimatedCircle
          cx={66}
          cy={66}
          r={54}
          fill="none"
          stroke={rem < 0 ? C.orange : C.acc}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={offset}
          opacity={pct > 0 ? 1 : 0}
          transform="rotate(-90 66 66)"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: size * 0.2, fontWeight: '800', color: C.ink, fontVariant: ['tabular-nums'] }}>{Math.abs(rem).toLocaleString('id-ID')}</Text>
        <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>kkal {rem < 0 ? 'lebih' : 'tersisa'}</Text>
      </View>
    </View>
  );
}

export function MacroBar({ name, v, max, color, bg }: { name: string; v: number; max: number; color: string; bg: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ width: 52, fontWeight: '600', fontSize: 12.5, color: C.ink }}>{name}</Text>
      <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: bg }}>
        <View style={{ width: `${Math.min(100, (v / max) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: color }} />
      </View>
      <Text style={{ width: 72, textAlign: 'right', color: C.muted, fontSize: 12 }}>
        {v} / {max} g
      </Text>
    </View>
  );
}

/** Grafik batang mingguan dengan garis target putus-putus. */
export function WeekBars({ values, labels, target, max }: { values: (number | null)[]; labels: string[]; target: number; max: number }) {
  const H = 130;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={[st.tgt, { bottom: (target / max) * H }]} />
        {values.map((v, i) => (
          <Bar key={i} h={v ? (v / max) * H : 0} over={!!v && v > target} delay={i * 80} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {labels.map((l) => (
          <Text key={l} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: C.muted }}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Bar({ h, over, delay }: { h: number; over: boolean; delay: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: h, duration: 800, delay, useNativeDriver: false }).start();
  }, [h, a, delay]);
  return <AView style={{ flex: 1, height: a, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: over ? C.orange : C.acc }} />;
}

const st = StyleSheet.create({
  tgt: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: C.muted, zIndex: 1 },
});
