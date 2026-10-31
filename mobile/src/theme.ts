import { Platform, ViewStyle } from 'react-native';

// Palet "Dapur Nusantara": hijau daun pisang, kunyit, cabai, di atas latar hijau-mint yang segar.
export const C = {
  acc: '#12724F', // daun pisang (aksi utama)
  accDark: '#0B5139',
  accBright: '#2FB57A', // daun muda (sorotan di atas hijau tua)
  soft: '#E1F3E9',
  mint: '#CBEBD9',
  line: '#E2ECE6',
  lineSoft: '#EEF4F0',
  muted: '#5A6E63',
  ink: '#11261C',
  bg: '#F2F7F4',
  card: '#FFFFFF',
  kunyit: '#F5B82E', // pencapaian, sorotan
  amber: '#FFF2CF',
  amberInk: '#6B4A00',
  orange: '#E08A1E',
  blue: '#3E6FB0',
  blueSoft: '#E5EEF9',
  disabled: '#B7C7BE',
  dashed: '#A9BDB2',
  red: '#C83A3F',
  heart: '#E5484D', // cabai
  dark: '#0F2A1F',
  camera: '#0C1A13',
};

/** Radius bertingkat: makin besar elemen, makin bulat sudutnya. */
export const R = { hero: 28, card: 22, tile: 18, btn: 16, input: 16, chip: 999 };

// Target sentuh minimal 44 px.
export const TOUCH = 44;

/** Bayangan berwarna hijau (bukan abu-abu) untuk kedalaman yang lembut. */
export function shadow(level: 1 | 2 | 3 = 1, color = '#0B5139'): ViewStyle {
  const m = { 1: [2, 8, 0.07, 2], 2: [6, 18, 0.11, 5], 3: [12, 28, 0.18, 10] }[level];
  return Platform.select<ViewStyle>({
    web: { boxShadow: `0px ${m[0]}px ${m[1]}px rgba(11,81,57,${m[2] + 0.02})` } as ViewStyle,
    default: { shadowColor: color, shadowOffset: { width: 0, height: m[0] }, shadowRadius: m[1] / 2, shadowOpacity: m[2] * 1.6, elevation: m[3] },
  })!;
}

/** Plus Jakarta Sans per ketebalan (Android butuh nama font per ketebalan). */
export const FONT: Record<string, string> = {
  '400': 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
};

/** Skala huruf. */
export const T = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.6 },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 15.5, lineHeight: 21, fontWeight: '700' as const },
  body: { fontSize: 14.5, lineHeight: 22, fontWeight: '400' as const },
  small: { fontSize: 12.5, lineHeight: 18, fontWeight: '500' as const },
  tiny: { fontSize: 11, lineHeight: 15, fontWeight: '600' as const },
};

/** Emoji per topik dan kategori — membantu pemindaian cepat. */
export const TOPIC_EMOJI: Record<string, string> = {
  'Meal prep': '🍱',
  'Rendah gula': '🍵',
  Vegetarian: '🥦',
  Camilan: '🍌',
  'Makan di luar': '🍛',
  'Resep hemat': '🥘',
  Untukmu: '✨',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  'Makanan pokok': '🍚',
  'Lauk hewani': '🍗',
  'Lauk nabati': '🫘',
  Sayur: '🥬',
  Buah: '🍎',
  'Hidangan warung': '🍜',
  'Jajanan & camilan': '🍢',
  Minuman: '🥤',
  'Susu & olahan': '🥛',
  'Kacang & biji': '🥜',
  'Bumbu & saus': '🧂',
  'Minyak & lemak': '🫒',
  'Hidangan internasional': '🍝',
};

/** Warna latar lembut per topik/kategori. */
export const TOPIC_TINT: Record<string, [string, string]> = {
  'Meal prep': ['#FFE9C7', '#F7C98B'],
  'Rendah gula': ['#E4F4D6', '#B9E0A0'],
  Vegetarian: ['#D9F2E2', '#9FD9B4'],
  Camilan: ['#FFF0BF', '#F6D26B'],
  'Makan di luar': ['#FFE1D6', '#F6AE92'],
  'Resep hemat': ['#E8E4FB', '#C2B8F0'],
};
export const CATEGORY_TINT: Record<string, string> = {
  'Makanan pokok': '#FFF4DC',
  'Lauk hewani': '#FFE6DC',
  'Lauk nabati': '#F3EAD9',
  Sayur: '#DDF3E5',
  Buah: '#FFE3E3',
  'Hidangan warung': '#FFEFD9',
  'Jajanan & camilan': '#FFF3C4',
  Minuman: '#E3EEFA',
  'Susu & olahan': '#EEF1FA',
  'Kacang & biji': '#F5EBDD',
  'Bumbu & saus': '#FBE8E3',
  'Minyak & lemak': '#F4F3D8',
  'Hidangan internasional': '#FCE9D6',
};

// Emoji spesifik per makanan (dicocokkan dari nama), jatuh ke emoji kategori bila tidak ada.
const FOOD_EMOJI: [RegExp, string][] = [
  // Nama bahasa Inggris (data USDA)
  [/\bchicken|turkey|duck\b/i, '🍗'], [/\bbeef|steak|lamb|veal\b/i, '🥩'], [/\bfish|salmon|tuna|cod\b/i, '🐟'], [/\bshrimp|crab|lobster\b/i, '🦐'], [/\begg/i, '🥚'],
  [/\bmilk\b/i, '🥛'], [/\bcheese\b/i, '🧀'], [/\byogurt\b/i, '🥣'], [/\bbread|toast|bagel\b/i, '🍞'], [/\brice\b/i, '🍚'], [/\bpasta|spaghetti|noodle/i, '🍝'],
  [/\bpotato/i, '🥔'], [/\btomato/i, '🍅'], [/\bcarrot/i, '🥕'], [/\bbroccoli/i, '🥦'], [/\bapple/i, '🍎'], [/\bbanana/i, '🍌'], [/\borange\b/i, '🍊'],
  [/\bstrawberr/i, '🍓'], [/\bgrape/i, '🍇'], [/\bavocado/i, '🥑'], [/\bcorn\b/i, '🌽'], [/\bcookie|cake|pie\b/i, '🍰'], [/\bcoffee\b/i, '☕'], [/\btea\b/i, '🍵'],
  [/\bjuice\b/i, '🧃'], [/\bpeanut|almond|walnut|cashew|nut/i, '🥜'], [/\bbean|lentil|soy|tofu/i, '🫘'], [/\bpizza/i, '🍕'], [/\bburger|hamburger/i, '🍔'], [/\boil\b/i, '🫒'],
  // Bahasa Indonesia — hidangan jadi dicocokkan lebih dulu daripada bahan (mis. "bubur ayam" → bubur)
  [/bubur/i, '🥣'], [/soto|bakso|sop\b|rawon|sayur bening/i, '🍲'], [/nasi goreng|nasi uduk|nasi kuning|lontong|ketupat/i, '🍚'], [/mie|bihun|kwetiau|soun/i, '🍜'],
  [/gado|pecel|karedok|urap|ketoprak|lotek/i, '🥗'], [/martabak/i, '🥞'], [/seblak/i, '🌶️'],
  [/air putih/i, '💧'], [/boba/i, '🧋'], [/jus/i, '🧃'], [/kopi/i, '☕'], [/teh/i, '🍵'], [/susu/i, '🥛'], [/yogurt/i, '🥣'],
  [/pisang/i, '🍌'], [/bawang/i, '🧅'], [/cabai|cabe|lombok/i, '🌶️'], [/wortel/i, '🥕'], [/tomat/i, '🍅'], [/jamur/i, '🍄'], [/kelapa|santan/i, '🥥'], [/minyak/i, '🫒'], [/keju/i, '🧀'], [/kambing|sapi|kerbau/i, '🥩'], [/cumi|kerang|kepiting/i, '🦐'], [/apel/i, '🍎'], [/alpukat/i, '🥑'], [/jeruk/i, '🍊'], [/semangka/i, '🍉'], [/mangga/i, '🥭'], [/pepaya|jambu/i, '🍈'],
  [/telur/i, '🥚'], [/ayam|sate/i, '🍗'], [/ikan|lele/i, '🐟'], [/udang/i, '🦐'], [/rendang|daging/i, '🥩'],
  [/tempe|tahu|edamame/i, '🫘'], [/kacang/i, '🥜'], [/brokoli/i, '🥦'], [/jagung/i, '🌽'], [/kentang/i, '🥔'], [/ubi|singkong/i, '🍠'],
  [/roti/i, '🍞'], [/oat/i, '🥣'], [/nasi goreng|nasi uduk|nasi putih|nasi merah|lontong/i, '🍚'], [/mie/i, '🍜'], [/bakso|soto|sop|sayur bening|bayam/i, '🍲'],
  [/martabak/i, '🥞'], [/kerupuk/i, '🍘'], [/gado|pecel|karedok|urap|ketoprak|capcay|kangkung|buncis|lodeh|asem/i, '🥗'], [/bakwan|mendoan|pisang goreng/i, '🍤'], [/seblak/i, '🌶️'], [/bubur/i, '🥣'],
];
export const foodEmoji = (name?: string | null, category?: string | null) => (name && FOOD_EMOJI.find(([re]) => re.test(name))?.[1]) || (category && CATEGORY_EMOJI[category]) || '🍽️';
