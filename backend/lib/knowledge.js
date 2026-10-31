// Pengambilan data dari database untuk "membumikan" (grounding) jawaban AI.
// AI hanya diberi makanan/tips yang relevan dan diminta memakai fakta dari data ini saja.

const TOPIC_HINTS = {
  'Meal prep': { tags: ['meal prep', 'tinggi protein'], cats: ['Lauk hewani', 'Lauk nabati', 'Sayur'] },
  'Rendah gula': { tags: ['rendah gula', 'buah', 'manis'], cats: ['Minuman', 'Buah'] },
  Vegetarian: { tags: ['sayur', 'tinggi serat'], cats: ['Lauk nabati', 'Sayur'] },
  Camilan: { tags: ['camilan', 'gorengan'], cats: ['Jajanan & camilan', 'Buah'] },
  'Makan di luar': { tags: ['warung', 'dibakar'], cats: ['Hidangan warung'] },
  'Resep hemat': { tags: ['hemat'], cats: ['Lauk nabati', 'Sayur', 'Makanan pokok'] },
};

const STOP = new Set(['yang', 'dan', 'atau', 'dengan', 'untuk', 'buat', 'aku', 'saya', 'kamu', 'mau', 'pengen', 'ingin', 'lagi', 'sama', 'tiap', 'hari', 'biar', 'tapi', 'sering', 'suka', 'makan', 'banget', 'lebih', 'sehat']);

const words = (s) =>
  String(s || '')
    .toLowerCase()
    .split(/[^a-z0-9À-ɏ]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));

export const SOURCE_LABEL = { CalMates: 'CalMates (per porsi)', TKPI: 'TKPI Kemenkes', USDA: 'USDA FoodData Central' };

export const rowFood = (r) => ({
  id: r.id,
  name: r.name,
  nameEn: r.name_en || '',
  source: r.source || 'CalMates',
  category: r.category,
  portion: r.portion,
  kcal: r.kcal,
  protein: r.protein,
  fat: r.fat,
  carb: r.carb,
  fiber: r.fiber,
  sugar: r.sugar ?? null,
  sodium: r.sodium ?? null,
  tags: r.tags ? r.tags.split(',') : [],
  tip: r.tip,
});

// Data referensi makanan untuk AI disimpan sementara di memori (10 menit) agar tidak dibaca ulang dari database setiap permintaan.
const foodCache = new WeakMap();
async function aiFoods(db) {
  const hit = foodCache.get(db);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.rows;
  // Untuk AI: makanan kurasi (per porsi) + TKPI. USDA (bahasa Inggris) tidak dipakai sebagai konteks.
  const rows = await db.prepare("SELECT * FROM foods WHERE source IN ('CalMates','TKPI')").all();
  foodCache.set(db, { at: Date.now(), rows });
  return rows;
}

/** Cari makanan paling relevan dengan teks dan/atau topik. */
export async function findFoods(db, { text = '', topic = '', limit = 8, excludeFried = false } = {}) {
  const all = await aiFoods(db);
  const ws = words(text);
  const hint = TOPIC_HINTS[topic];
  const scored = all.map((f) => {
    const name = f.name.toLowerCase();
    const tags = f.tags.split(',');
    let s = 0;
    for (const w of ws) {
      if (name.includes(w)) s += 4;
      else if (tags.some((t) => t.includes(w))) s += 2;
      else if (f.category.toLowerCase().includes(w)) s += 1;
    }
    if (hint) {
      if (hint.cats.includes(f.category)) s += 1.5;
      if (tags.some((t) => hint.tags.includes(t))) s += 1.5;
    }
    if (excludeFried && tags.includes('digoreng')) s -= 1;
    if (f.source === 'CalMates') s *= 1.5;
    if (tags.includes('bahan mentah')) s -= 1.5;
    return { f, s: s + Math.random() * 0.5 };
  });
  return scored
    .filter((x) => x.s > 0.6)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => rowFood(x.f));
}

export async function tipsFor(db, topic, limit = 4) {
  const rows = (await db.prepare("SELECT * FROM tips WHERE topic = ? OR topic = 'Umum' ORDER BY (topic = ?) DESC, random() LIMIT ?").all(topic || 'Umum', topic || 'Umum', limit));
  return rows.map((t) => ({ id: t.id, topic: t.topic, title: t.title, body: t.body }));
}

export async function contentList(db, { includePremium = false } = {}) {
  return (await db
    .prepare('SELECT data FROM content ORDER BY sort')
    .all())
    .map((r) => JSON.parse(r.data))
    .filter((c) => includePremium || !c.premium);
}

/** Format data untuk prompt AI (ringkas, satu baris per item). */
export function foodsForPrompt(foods) {
  return foods
    .map((f) => `- ${f.id} | ${f.name} (${f.portion}) | ±${Math.round(f.kcal)} kkal, protein ${f.protein} g, serat ${f.fiber} g | ${f.tags.join(', ')} | tips: ${f.tip}`)
    .join('\n');
}

export function tipsForPrompt(tips) {
  return tips.map((t) => `- ${t.title}: ${t.body}`).join('\n');
}
