import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './Text';

/** Cincin progres (misalnya hari tantangan yang selesai). */
export function ProgressRing({ value, max, size = 64, stroke = 7, color = '#F5B82E', track = 'rgba(255,255,255,0.22)', label, labelColor = '#fff' }: { value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; label?: string; labelColor?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`${value} dari ${max}`}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - p)} strokeLinecap="round" />
      </Svg>
      <Text style={{ fontSize: size * 0.27, fontWeight: '800', color: labelColor }}>{label ?? `${value}/${max}`}</Text>
    </View>
  );
}
