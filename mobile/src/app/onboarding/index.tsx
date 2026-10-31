import { router } from 'expo-router';
import { AView } from '../../components/AView';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plate } from '../../components/Plate';
import { Text } from '../../components/Text';
import { Btn, Grad, LinkBtn } from '../../components/ui';
import { C, shadow } from '../../theme';

// Emoji makanan yang mengitari piring: tempe, sayur, buah, nasi, teh, telur.
const ORBIT: { e: string; x: number; y: number; d: number }[] = [
  { e: '🫘', x: -112, y: -58, d: 0 },
  { e: '🥬', x: 104, y: -76, d: 300 },
  { e: '🍌', x: 122, y: 38, d: 600 },
  { e: '🍚', x: -124, y: 52, d: 900 },
  { e: '🍵', x: -40, y: -118, d: 1200 },
  { e: '🍳', x: 44, y: 112, d: 1500 },
];

/** Selamat datang. Satu momen animasi: emoji makanan melayang pelan di sekitar piring. */
export default function Welcome() {
  const ins = useSafeAreaInsets();
  const anims = useRef(ORBIT.map(() => new Animated.Value(0))).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) {
        enter.setValue(1);
        return;
      }
      Animated.timing(enter, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
      loops = anims.map((a, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(ORBIT[i].d),
            Animated.timing(a, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(a, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        ),
      );
      loops.forEach((l) => l.start());
    });
    return () => loops.forEach((l) => l.stop());
  }, [anims, enter]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <Grad from="#178A60" to="#0B5139" style={[st.top, { paddingTop: ins.top + 24 }]}>
          <View style={st.blobA} />
          <View style={st.stage}>
            <AView style={[st.plate, { opacity: enter, transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
              <Plate size={150} />
            </AView>
            {ORBIT.map((o, i) => (
              <AView
                key={o.e}
                style={[
                  st.bubble,
                  {
                    opacity: enter,
                    transform: [{ translateX: o.x }, { translateY: Animated.add(o.y, anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, -10] })) }],
                  },
                ]}
              >
                <Text style={{ fontSize: 26 }}>{o.e}</Text>
              </AView>
            ))}
          </View>
        </Grad>

        <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 26, paddingBottom: ins.bottom + 16 }}>
          <Text style={{ fontSize: 32, lineHeight: 38, fontWeight: '800', color: C.ink, letterSpacing: -0.8 }}>Makan sehat lebih ringan kalau bareng teman.</Text>
          <Text style={{ marginTop: 12, fontSize: 15.5, lineHeight: 24, color: C.muted }}>Ceritakan dirimu dalam satu kalimat. CalMates menyusun rencana kecil yang realistis, lalu kamu jalani bersama komunitas.</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {['✨ Rencana dari AI', '🏁 Tantangan mingguan', '🍲 74 makanan lokal'].map((t) => (
              <View key={t} style={st.feat}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.accDark }}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, minHeight: 24 }} />
          <Btn title="Mulai, gratis" onPress={() => router.push('/onboarding/agent')} />
          <LinkBtn title="Pilih tujuan sendiri" onPress={() => router.push('/onboarding/goals')} style={{ marginTop: 4 }} />
          <LinkBtn title="Sudah punya akun? Masuk" muted onPress={() => router.push('/onboarding/login')} />
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  top: { height: 400, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  blobA: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(47,181,122,0.35)', top: -120, right: -100 },
  blobB: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(245,184,46,0.18)', bottom: -80, left: -60 },
  stage: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  plate: { width: 176, height: 176, borderRadius: 88, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  bubble: { position: 'absolute', width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow(2) },
  feat: { backgroundColor: C.soft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
});
