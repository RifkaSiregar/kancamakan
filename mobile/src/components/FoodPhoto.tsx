import { useMemo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Ilustrasi "foto" nasi goreng tampak atas di meja kayu, untuk demo fitur foto makanan.
 * Dibuat dengan SVG (tanpa foto dari internet) supaya bebas hak cipta dan tajam di semua ukuran.
 */
export function FoodPhoto({ width = 300, height = 300, rounded = 0 }: { width?: number | string; height?: number | string; rounded?: number }) {
  // Butiran nasi & topping — posisi acak tapi tetap (seed) supaya gambar tidak berubah tiap render.
  const bits = useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const inMound = (x: number, y: number) => ((x - 150) / 78) ** 2 + ((y - 152) / 66) ** 2 < 1;
    const grains: { x: number; y: number; r: number; c: string }[] = [];
    while (grains.length < 170) {
      const x = 70 + rnd() * 160;
      const y = 84 + rnd() * 136;
      if (!inMound(x, y)) continue;
      grains.push({ x, y, r: rnd() * 180, c: ['#EFC873', '#E2AE4F', '#F6D894', '#C98F35'][Math.floor(rnd() * 4)] });
    }
    const top: { x: number; y: number; t: 'daun' | 'cabai' | 'ayam'; r: number }[] = [];
    while (top.length < 34) {
      const x = 76 + rnd() * 148;
      const y = 92 + rnd() * 120;
      if (!inMound(x, y) || ((x - 168) ** 2 + (y - 128) ** 2 < 900)) continue;
      top.push({ x, y, t: (['daun', 'daun', 'cabai', 'ayam', 'ayam'] as const)[Math.floor(rnd() * 5)], r: rnd() * 180 });
    }
    return { grains, top };
  }, []);

  return (
    <Svg width={width} height={height} viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" style={rounded ? { borderRadius: rounded } : undefined}>
      <Defs>
        <LinearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9A6440" />
          <Stop offset="1" stopColor="#6B4128" />
        </LinearGradient>
        <RadialGradient id="plate" cx="0.45" cy="0.4" r="0.6">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E9E5DC" />
        </RadialGradient>
        <RadialGradient id="rice" cx="0.45" cy="0.35" r="0.7">
          <Stop offset="0" stopColor="#E8B65A" />
          <Stop offset="1" stopColor="#B87B2B" />
        </RadialGradient>
        <RadialGradient id="yolk" cx="0.4" cy="0.35" r="0.65">
          <Stop offset="0" stopColor="#FFD75E" />
          <Stop offset="1" stopColor="#F09A0E" />
        </RadialGradient>
        <RadialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
          <Stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </RadialGradient>
      </Defs>

      {/* Meja kayu */}
      <Rect width="300" height="300" fill="url(#wood)" />
      {[38, 96, 154, 212, 270].map((y) => (
        <Line key={y} x1="0" y1={y} x2="300" y2={y + 6} stroke="#4E2E1B" strokeOpacity="0.45" strokeWidth="2" />
      ))}
      {[20, 60, 120, 180, 240].map((y, i) => (
        <Path key={i} d={`M0 ${y} C 80 ${y - 8}, 160 ${y + 10}, 300 ${y - 4}`} stroke="#C08A5E" strokeOpacity="0.18" strokeWidth="3" fill="none" />
      ))}

      {/* Mangkuk sambal di pojok */}
      <Ellipse cx="262" cy="52" rx="34" ry="34" fill="#000" opacity="0.2" />
      <Circle cx="258" cy="46" r="30" fill="#F7F4EE" />
      <Circle cx="258" cy="46" r="22" fill="#B8281E" />
      <Circle cx="252" cy="40" r="6" fill="#D9452F" opacity="0.8" />
      {[[262, 50], [250, 52], [265, 38]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r="1.6" fill="#F3C25A" />
      ))}

      {/* Sendok */}
      <G opacity="0.95">
        <Ellipse cx="40" cy="250" rx="13" ry="18" fill="#D9DDE0" transform="rotate(-35 40 250)" />
        <Rect x="44" y="200" width="7" height="58" rx="3.5" fill="#C3C8CC" transform="rotate(-35 47 229)" />
      </G>

      {/* Piring */}
      <Ellipse cx="156" cy="160" rx="128" ry="126" fill="#000" opacity="0.28" />
      <Circle cx="150" cy="152" r="124" fill="url(#plate)" />
      <Circle cx="150" cy="152" r="100" fill="#FBFAF6" stroke="#E6E1D6" strokeWidth="2" />

      {/* Timun & tomat di pinggir piring */}
      {[[82, 222], [100, 236], [64, 204]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r="13" fill="#4E8F34" />
          <Circle cx={x} cy={y} r="11" fill="#D6EDB6" />
          <Circle cx={x} cy={y} r="5" fill="#BFDD94" />
        </G>
      ))}
      {[[218, 226], [234, 208]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r="13" fill="#D63A2C" />
          <Circle cx={x} cy={y} r="9.5" fill="#EE6A55" />
          <Circle cx={x - 3} cy={y - 2} r="1.8" fill="#F8D7A8" />
          <Circle cx={x + 3} cy={y + 2} r="1.8" fill="#F8D7A8" />
        </G>
      ))}

      {/* Kerupuk */}
      <Path d="M214 78 q14 -10 28 2 q12 10 4 26 q-8 14 -24 10 q-16 -4 -18 -18 q-2 -12 10 -20z" fill="#F6E5BC" stroke="#E6CF98" strokeWidth="1.5" />
      {[[224, 88], [234, 96], [222, 102], [236, 84]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r="1.8" fill="#E2C37F" />
      ))}

      {/* Gundukan nasi goreng */}
      <Ellipse cx="152" cy="158" rx="84" ry="72" fill="#000" opacity="0.12" />
      <Path d="M72 150 C 70 104, 116 82, 152 84 C 196 86, 234 108, 230 154 C 228 196, 192 222, 150 222 C 106 222, 74 196, 72 150 Z" fill="url(#rice)" />
      {bits.grains.map((g, i) => (
        <Ellipse key={i} cx={g.x} cy={g.y} rx="3.4" ry="1.7" fill={g.c} transform={`rotate(${g.r} ${g.x} ${g.y})`} />
      ))}
      {bits.top.map((t, i) =>
        t.t === 'daun' ? (
          <Rect key={i} x={t.x} y={t.y} width="5" height="2.4" rx="1" fill="#4F9B3A" transform={`rotate(${t.r} ${t.x} ${t.y})`} />
        ) : t.t === 'cabai' ? (
          <Circle key={i} cx={t.x} cy={t.y} r="1.9" fill="#C8352A" />
        ) : (
          <Rect key={i} x={t.x} y={t.y} width="8" height="6" rx="2.5" fill="#B06B32" transform={`rotate(${t.r} ${t.x} ${t.y})`} />
        ),
      )}

      {/* Telur mata sapi */}
      <Path d="M140 104 C 150 92, 176 92, 190 102 C 204 112, 202 134, 192 146 C 182 158, 156 160, 144 150 C 130 140, 128 116, 140 104 Z" fill="#FFFDF7" />
      <Path d="M146 112 C 150 104, 166 100, 176 106" stroke="#F1E6CE" strokeWidth="2" fill="none" />
      <Circle cx="168" cy="127" r="15" fill="url(#yolk)" />
      <Ellipse cx="163" cy="121" rx="5" ry="3" fill="#FFF3C4" opacity="0.8" />
      <Path d="M152 140 C 156 146, 170 148, 180 142" stroke="#C88A3A" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />

      <Rect width="300" height="300" fill="url(#vignette)" />
    </Svg>
  );
}
