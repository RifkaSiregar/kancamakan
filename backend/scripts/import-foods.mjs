// Membangun data makanan tambahan dari sumber terbuka.
//
//   node scripts/import-foods.mjs /path/ke/food-nutrition
//
// Sumber (unduh dulu: git clone https://github.com/intanypurbasari/food-nutrition):
//   - data_clean/tkpi_clean.csv  → Tabel Komposisi Pangan Indonesia (Kemenkes, panganku.org), dibersihkan oleh
//                                   intanypurbasari/food-nutrition (lisensi MIT). Nilai per 100 g.
//   - usda-csv/*                 → USDA FoodData Central SR Legacy (domain publik). Nilai per 100 g.
// Hasil: data/foods_tkpi.json dan data/foods_usda.json (dibaca otomatis oleh lib/db.js saat backend menyala).
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const root = process.argv[2];
if (!root) {
  console.error('Pakai: node scripts/import-foods.mjs /path/ke/food-nutrition');
  process.exit(1);
}
const out = new URL('../data/', import.meta.url).pathname;

/** Pengurai CSV kecil yang mendukung tanda kutip. */
function parseLine(line) {
  const cells = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') cells.push(cur), (cur = '');
    else cur += ch;
  }
  cells.push(cur);
  return cells;
}
const readCsv = (file) => {
  const [head, ...rows] = readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const h = parseLine(head);
  return rows.map((r) => Object.fromEntries(parseLine(r).map((v, i) => [h[i], v])));
};
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 10) / 10);

// ---------- TKPI ----------
const TKPI_CAT = {
  Sayuran: 'Sayur', 'Ikan/Kerang/Udang dll': 'Lauk hewani', 'Kacang-Kacangan': 'Lauk nabati', Serealia: 'Makanan pokok', Buah: 'Buah',
  Daging: 'Lauk hewani', 'Umbi Berpati': 'Makanan pokok', Bumbu: 'Bumbu & saus', Telur: 'Lauk hewani', 'Minyak/Lemak': 'Minyak & lemak',
  Konfeksioneri: 'Jajanan & camilan', Susu: 'Susu & olahan', 'Minuman Non Alkohol': 'Minuman',
};
const tkpi = readCsv(join(root, 'data_clean/tkpi_clean.csv'))
  .filter((r) => r.energy_kcal !== '')
  .map((r) => {
    const m = r.food_name_original.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    const name = (m ? m[1] : r.food_name_original).replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
    const en = m ? m[2].trim() : '';
    return [`tkpi-${r.food_id.split('_')[1]}`, name, en, TKPI_CAT[r.category_original] ?? 'Lainnya', num(r.energy_kcal), num(r.protein_g), num(r.fat_g), num(r.carbohydrate_g), num(r.fiber_g), num(r.sugars_total_g), num(r.sodium_mg)];
  });
writeFileSync(join(out, 'foods_tkpi.json'), JSON.stringify(tkpi));
console.log(`TKPI: ${tkpi.length} makanan`);

// ---------- USDA SR Legacy ----------
const USDA_CAT = {
  1: 'Susu & olahan', 2: 'Bumbu & saus', 4: 'Minyak & lemak', 5: 'Lauk hewani', 6: 'Bumbu & saus', 7: 'Lauk hewani', 8: 'Makanan pokok',
  9: 'Buah', 11: 'Sayur', 12: 'Kacang & biji', 13: 'Lauk hewani', 14: 'Minuman', 15: 'Lauk hewani', 16: 'Lauk nabati', 17: 'Lauk hewani',
  18: 'Jajanan & camilan', 19: 'Jajanan & camilan', 20: 'Makanan pokok', 21: 'Hidangan internasional', 22: 'Hidangan internasional',
  23: 'Jajanan & camilan', 25: 'Hidangan internasional',
};
// Dilewati: 3 makanan bayi, 10 produk babi, 24 makanan suku asli Amerika, 26/27 data merek & kontrol kualitas, 28 minuman beralkohol.
const NUTR = { 1008: 'kcal', 1003: 'p', 1004: 'f', 1005: 'c', 1079: 'fiber', 2000: 'sugar', 1093: 'na' };
const foods = new Map();
for (const r of readCsv(join(root, 'usda-csv/food.csv'))) {
  const cat = USDA_CAT[Number(r.food_category_id)];
  if (!cat || r.data_type !== 'sr_legacy_food') continue;
  if (/\b(pork|bacon|ham|lard|wine|beer|liqueur)\b/i.test(r.description)) continue;
  foods.set(r.fdc_id, { name: r.description, cat });
}
const rl = createInterface({ input: createReadStream(join(root, 'usda-csv/food_nutrient.csv')) });
let header;
for await (const line of rl) {
  const c = parseLine(line);
  if (!header) {
    header = Object.fromEntries(c.map((h, i) => [h, i]));
    continue;
  }
  const f = foods.get(c[header.fdc_id]);
  const key = NUTR[c[header.nutrient_id]];
  if (f && key) f[key] = num(c[header.amount]);
}
const usda = [...foods.entries()]
  .filter(([, f]) => f.kcal != null)
  .map(([id, f]) => [`usda-${id}`, f.name, f.name, f.cat, f.kcal, f.p ?? 0, f.f ?? 0, f.c ?? 0, f.fiber, f.sugar, f.na]);
writeFileSync(join(out, 'foods_usda.json'), JSON.stringify(usda));
console.log(`USDA: ${usda.length} makanan`);
