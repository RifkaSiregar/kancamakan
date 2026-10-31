// Konstanta aplikasi + data CONTOH khusus untuk demo fitur Premium (layar demo).
// Data komunitas, makanan, dan konten diambil dari backend (database).

export const TOPICS = ['Meal prep', 'Rendah gula', 'Vegetarian', 'Camilan', 'Makan di luar', 'Resep hemat'];

export const GOALS: [string, string][] = [
  ['Menurunkan berat badan', 'Dibantu komunitas dan tantangan'],
  ['Menjaga berat badan', 'Tetap konsisten tanpa ribet'],
  ['Pola makan lebih sehat', 'Pelan-pelan, mulai dari kebiasaan'],
];

export const FOOD_CATEGORIES = ['Hidangan warung', 'Makanan pokok', 'Lauk hewani', 'Lauk nabati', 'Sayur', 'Buah', 'Jajanan & camilan', 'Minuman', 'Susu & olahan', 'Kacang & biji', 'Bumbu & saus', 'Minyak & lemak', 'Hidangan internasional'];

// ---------- khusus demo Premium (belum tersedia) ----------

export interface Food {
  n: string; // nama
  k: number; // kkal per porsi sedang
  p: number;
  l: number;
  c: number;
}

export const FOODS: Record<string, Food> = {
  nasgor: { n: 'Nasi goreng ayam', k: 500, p: 16, l: 18, c: 68 },
  miegor: { n: 'Mie goreng', k: 450, p: 10, l: 18, c: 60 },
  nasuduk: { n: 'Nasi uduk', k: 280, p: 6, l: 9, c: 42 },
  soto: { n: 'Soto ayam', k: 240, p: 18, l: 9, c: 20 },
  bakso: { n: 'Bakso kuah', k: 260, p: 15, l: 10, c: 27 },
  sop: { n: 'Sop ayam', k: 190, p: 15, l: 6, c: 17 },
  gado: { n: 'Gado-gado', k: 295, p: 12, l: 16, c: 25 },
  pecel: { n: 'Pecel sayur', k: 260, p: 11, l: 13, c: 26 },
  karedok: { n: 'Karedok', k: 180, p: 7, l: 10, c: 16 },
};

export type FoodId = keyof typeof FOODS;

// Tiga "foto contoh" untuk mode demo tanpa backend AI.
export const DISHES: { c: FoodId[]; pal: [string, string, string, string] }[] = [
  { c: ['nasgor', 'miegor', 'nasuduk'], pal: ['#E7B55B', '#C9892F', '#7DB36A', '#D8503B'] },
  { c: ['soto', 'bakso', 'sop'], pal: ['#F2D27A', '#E8B94A', '#7DB36A', '#FFFFFF'] },
  { c: ['gado', 'pecel', 'karedok'], pal: ['#9CCB7B', '#6BA45A', '#E7B55B', '#C9892F'] },
];

export const PORTIONS: [string, number][] = [
  ['Kecil', 0.75],
  ['Sedang', 1],
  ['Besar', 1.3],
];

export const DAILY_TARGET = 1800;
export const MACRO_TARGET = { p: 80, l: 60, c: 220 };
export const PRICE_YEAR = 'Rp 350.000';
export const PRICE_MONTH_EQ = 'sekitar Rp 29.000 per bulan';
