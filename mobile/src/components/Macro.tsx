import { View } from 'react-native';
import { C } from '../theme';
import { Text } from './Text';

export const MACRO_COLORS = { protein: C.acc, fat: C.kunyit, carb: '#7FA7CF' };

/** Bilah komposisi energi dari protein, lemak, karbo (perkiraan 4/9/4 kkal per gram). */
export function MacroBar({ protein, fat, carb, height = 8 }: { protein: number; fat: number; carb: number; height?: number }) {
  const p = protein * 4, f = fat * 9, c = carb * 4;
  const t = p + f + c || 1;
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: C.lineSoft, gap: 2 }} accessibilityLabel={`Protein ${protein} gram, lemak ${fat} gram, karbo ${carb} gram`}>
      {p > 0 && <View style={{ flex: p / t, backgroundColor: MACRO_COLORS.protein }} />}
      {f > 0 && <View style={{ flex: f / t, backgroundColor: MACRO_COLORS.fat }} />}
      {c > 0 && <View style={{ flex: c / t, backgroundColor: MACRO_COLORS.carb }} />}
    </View>
  );
}

export function MacroLegend({ items }: { items: [keyof typeof MACRO_COLORS, string, string][] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {items.map(([k, label, v]) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: MACRO_COLORS[k] }} />
          <Text style={{ fontSize: 12.5, color: C.muted, fontWeight: '600' }}>
            {label} <Text style={{ color: C.ink, fontWeight: '800' }}>{v}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}
