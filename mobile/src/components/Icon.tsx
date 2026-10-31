import Svg, { Circle, Path } from 'react-native-svg';

// Ikon garis yang sama dengan prototipe (viewBox 24×24).
const P = {
  home: [{ d: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' }],
  flag: [{ d: 'M5 21V4m0 0h11l-2 4 2 4H5' }],
  msg: [{ d: 'M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.2A8 8 0 1 1 21 12z' }],
  user: [{ d: 'M20 21a8 8 0 0 0-16 0' }, { c: [12, 8, 4] }],
  clock: [{ c: [12, 12, 8] }, { d: 'M12 8v4l3 2' }],
  heart: [{ d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' }],
  plus: [{ d: 'M12 5v14M5 12h14' }],
  check: [{ d: 'M5 12l4 4 10-10' }],
  back: [{ d: 'M15 5l-7 7 7 7' }],
  chev: [{ d: 'M9 5l7 7-7 7' }],
  bowl: [{ d: 'M3 11h18a9 9 0 0 1-18 0z' }, { d: 'M8 7c0-1.5 1.5-1.5 1.5-3M13 7c0-1.5 1.5-1.5 1.5-3' }],
  logout: [{ d: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10' }],
  close: [{ d: 'M6 6l12 12M18 6L6 18' }],
  cam: [{ d: 'M4 8h3l2-3h6l2 3h3v11H4z' }, { c: [12, 13, 3.5] }],
  image: [{ d: 'M4 5h16v14H4z' }, { d: 'M4 16l5-5 4 4 3-3 4 4' }, { c: [15.5, 9, 1.5] }],
  search: [{ c: [11, 11, 7] }, { d: 'M20 20l-4-4' }],
  bell: [{ d: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6' }, { d: 'M10 19a2 2 0 0 0 4 0' }],
  book: [{ d: 'M6 4h12v17l-6-4-6 4z' }],
  dots: [{ c: [5, 12, 1.6] }, { c: [12, 12, 1.6] }, { c: [19, 12, 1.6] }],
  play: [{ d: 'M7 4l13 8-13 8z' }],
  pause: [{ d: 'M8 5v14M16 5v14' }],
  spark: [{ d: 'M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z' }, { d: 'M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z' }],
  trash: [{ d: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3' }],
} as const;

export type IconName = keyof typeof P;

export function Icon({
  name,
  size = 22,
  color = '#16221B',
  stroke = 1.8,
  fill = 'none',
}: {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {P[name].map((s, i) =>
        'd' in s ? <Path key={i} d={s.d} /> : <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} />,
      )}
    </Svg>
  );
}
