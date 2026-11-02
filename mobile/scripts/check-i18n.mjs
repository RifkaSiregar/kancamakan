// Cek semua t('...') di src/ punya terjemahan di src/i18n/en.ts.  Jalankan: npm run check:i18n
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const en = new Set();
for (const m of readFileSync(join(root, 'i18n/en.ts'), 'utf8').matchAll(/^\s*("(?:[^"\\]|\\.)*"):/gm)) en.add(JSON.parse(m[1]));

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f) && !p.includes('/i18n/')) files.push(p);
  }
};
walk(root);

// t('…'), t("…") — argumen pertama berupa teks literal.
const RE = /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
const missing = new Map();
let used = 0;
for (const f of files) {
  for (const m of readFileSync(f, 'utf8').matchAll(RE)) {
    used++;
    const raw = m[1] ?? m[2];
    const key = m[1] !== undefined ? raw.replace(/\\'/g, "'").replace(/\\\\/g, '\\') : JSON.parse(`"${raw}"`);
    if (!en.has(key)) missing.set(key, f.slice(root.length));
  }
}
if (missing.size) {
  console.log(`${missing.size} teks belum diterjemahkan:`);
  for (const [k, f] of missing) console.log(`  ${f}: ${k}`);
  process.exit(1);
}
console.log(`OK: ${used} pemakaian t(), ${en.size} terjemahan.`);
