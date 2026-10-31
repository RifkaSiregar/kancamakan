import Svg, { Circle, Path } from 'react-native-svg';
import { DISHES } from '../data/sample';

// Ilustrasi piring makanan (pengganti foto pada data contoh).
export function Plate({ dish = 0, size = 120 }: { dish?: number; size?: number }) {
  const q = DISHES[dish % DISHES.length].pal;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={92} fill="#EDEBE4" />
      <Circle cx={100} cy={100} r={70} fill="#F7F6F1" />
      <Path d="M52 104c4-30 28-46 52-42 24 3 44 20 42 44-1 14-20 26-48 26s-50-10-46-28z" fill={q[0]} />
      <Circle cx={82} cy={92} r={9} fill={q[1]} />
      <Circle cx={110} cy={84} r={8} fill={q[1]} />
      <Circle cx={124} cy={108} r={9} fill={q[1]} />
      <Circle cx={92} cy={116} r={7} fill={q[1]} />
      <Circle cx={70} cy={110} r={6} fill={q[2]} />
      <Circle cx={118} cy={128} r={6} fill={q[2]} />
      <Path d="M128 66c10-4 22 2 24 12-10 4-22-2-24-12z" fill={q[3]} stroke="#ddd" strokeWidth={1} />
    </Svg>
  );
}
