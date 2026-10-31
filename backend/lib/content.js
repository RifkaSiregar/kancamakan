// Prompt dan pembersih keluaran AI untuk konten komunitas.
// Semua keluaran AI divalidasi di sini sebelum disimpan/dikirim ke aplikasi.

// Harus sama dengan TOPICS di mobile/src/data/sample.ts
export const TOPICS = ['Meal prep', 'Rendah gula', 'Vegetarian', 'Camilan', 'Makan di luar', 'Resep hemat'];
export const KINDS = ['Bagikan', 'Tanya', 'Resep'];

export const MAX_POST = 280;
export const MAX_FOOD = 40;
export const MAX_REPLY = 140;

const RULES = `Aturan WAJIB:
- Bahasa Indonesia santai dan ramah, seperti obrolan komunitas. Makanan Indonesia sehari-hari (warung, rumahan, bekal).
- Fakta tentang makanan (kandungan, cara masak, tips) HANYA boleh diambil dari DATA yang diberikan. Jangan mengarang angka.
- Jangan menulis angka berat badan, target turun berat badan, atau angka kalori di teks.
- Jangan menyarankan diet ekstrem, puasa berhari-hari, melewatkan makan, obat/suplemen pelangsing, atau memuntahkan makanan.
- Jangan membuat klaim medis, jangan mengaku ahli gizi/dokter.
- Tanpa hashtag dan tautan, emoji maksimal 1.`;

const dataBlock = (foods, tips) =>
  `DATA MAKANAN (id | nama | perkiraan gizi per porsi | tag | tips):\n${foods || '(tidak ada)'}\n\nDATA TIPS:\n${tips || '(tidak ada)'}`;

/** Postingan untuk akun resmi "Asisten CalMates" (diberi label AI di aplikasi). */
export function systemBotPosts(foods, tips) {
  return `Kamu adalah "Asisten CalMates", akun resmi di aplikasi komunitas makan sehat. Kamu BUKAN manusia dan tidak berpura-pura menjadi anggota.
Tugasmu menulis postingan yang memancing diskusi dan berbagi pengetahuan praktis: tips, resep singkat, atau pertanyaan untuk komunitas.
${RULES}
Panjang teks setiap postingan maksimal 260 karakter.

${dataBlock(foods, tips)}

Jawab HANYA dengan JSON:
{"posts":[{"kind":"Bagikan|Tanya|Resep","topic":"salah satu dari: ${TOPICS.join(', ')}","food_id":"id dari DATA MAKANAN atau null","food_label":"label singkat maks 4 kata","text":"isi"}]}`;
}

export function systemDraft(foods, tips) {
  return `Kamu membantu pengguna aplikasi komunitas makan sehat menulis postingan singkat atas nama mereka sendiri.
${RULES}
Panjang teks maksimal 260 karakter. Pertahankan maksud pengguna.

${dataBlock(foods, tips)}

Jawab HANYA dengan JSON: {"food_id":"id dari DATA MAKANAN yang paling sesuai atau null","food_label":"label makanan singkat (maks 4 kata)","text":"isi postingan"}`;
}

export function systemReplies(foods, tips) {
  return `Kamu menyarankan tanggapan singkat untuk postingan di komunitas makan sehat.
Buat 3 tanggapan berbeda yang suportif dan berguna (apresiasi, tips praktis dari DATA, atau pertanyaan lanjutan).
${RULES}
Setiap tanggapan maksimal 120 karakter.

${dataBlock(foods, tips)}

Jawab HANYA dengan JSON: {"replies":["...","...","..."]}`;
}

// ---------- pembersih ----------

export function extractJson(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

// Pola berbahaya untuk SEMUA konten (pengguna & AI).
const HARMFUL = [
  /obat\s+(pelangsing|diet|kurus)/i,
  /pil\s+(pelangsing|diet|kurus)/i,
  /(memuntahkan|muntahin|dimuntahkan)/i,
  /tidak\s+makan\s+(sama\s+sekali|seharian|berhari)/i,
  /puasa\s+\d+\s+hari/i,
  /pencahar|laksatif/i,
];
// Tambahan khusus keluaran AI (AI tidak boleh menyebut angka berat/kalori atau tautan).
const AI_ONLY = [/\b\d{2,3}\s?(kg|kilo)\b/i, /turun\s+\d+\s?(kg|kilo)/i, /\b\d{3,4}\s?(kkal|kalori|kcal)\b/i, /https?:\/\//i];

export const isHarmful = (text) => HARMFUL.some((re) => re.test(text));
export const isSafe = (text) => !isHarmful(text) && !AI_ONLY.some((re) => re.test(text));

export function clean(text, max) {
  const t = String(text ?? '')
    .replace(/[\u0000-\u001f]+/g, ' ')
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:]+$/, '') + '…';
}

export function parseDraft(text, foodIds) {
  const j = extractJson(text);
  if (!j || typeof j.text !== 'string') return null;
  const body = clean(j.text, MAX_POST);
  if (body.length < 10 || !isSafe(body)) return null;
  return { text: body, food_label: clean(j.food_label || '', MAX_FOOD), food_id: foodIds.includes(j.food_id) ? j.food_id : null };
}

export function parseBotPosts(text, { topics, foodIds, count }) {
  const j = extractJson(text);
  if (!j || !Array.isArray(j.posts)) return [];
  const allowed = topics.length ? topics : TOPICS;
  const out = [];
  for (const p of j.posts) {
    if (!p || typeof p.text !== 'string') continue;
    const body = clean(p.text, MAX_POST);
    if (body.length < 10 || !isSafe(body)) continue;
    out.push({
      kind: KINDS.includes(p.kind) ? p.kind : 'Bagikan',
      topic: allowed.includes(p.topic) ? p.topic : allowed[out.length % allowed.length],
      food_id: foodIds.includes(p.food_id) ? p.food_id : null,
      food_label: clean(p.food_label || '', MAX_FOOD),
      text: body,
    });
    if (out.length >= count) break;
  }
  return out;
}

export function parseReplies(text) {
  const j = extractJson(text);
  if (!j || !Array.isArray(j.replies)) return [];
  return [...new Set(j.replies.filter((r) => typeof r === 'string').map((r) => clean(r, MAX_REPLY)))]
    .filter((r) => r.length >= 4 && isSafe(r))
    .slice(0, 3);
}
