// Backend CalMates: API komunitas + database (SQLite lokal / Turso) + fitur AI (Claude).
// - Lokal:  npm run dev  →  http://0.0.0.0:3000 (cek /health)
// - Vercel: file ini diekspor sebagai aplikasi Express (export default), Vercel menjalankannya sebagai function.
// Daftar endpoint ada di README dan lib/app.js.
import 'dotenv/config';
// Vercel mendeteksi aplikasi Express dari file yang meng-import 'express'.
import express from 'express';
import { fileURLToPath } from 'node:url';
import { MODEL, createApp } from './lib/app.js';

// Satu aplikasi utama; semua route ada di lib/app.js.
const app = express();
app.disable('x-powered-by');
const api = createApp();
app.set('adminToken', api.get('adminToken'));
app.set('trust proxy', api.get('trust proxy'));
app.use(api);
export default app;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend CalMates jalan di http://0.0.0.0:${PORT} (model ${MODEL})`);
    console.log(`Dasbor moderasi: http://localhost:${PORT}/admin  ·  token admin: ${app.get('adminToken')}${process.env.ADMIN_TOKEN ? ' (dari .env)' : ' (acak; atur ADMIN_TOKEN di .env agar tetap)'}`);
    if (!process.env.ANTHROPIC_API_KEY) console.warn('ℹ ANTHROPIC_API_KEY belum diatur: fitur AI memakai generator berbasis database (tanpa AI).');
  });
}
