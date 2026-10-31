// Backend CalMates: API komunitas + database SQLite + fitur AI (Claude).
// Jalankan: npm run dev  →  http://0.0.0.0:3000 (cek /health)
//
// Ringkasan endpoint (detail di README):
//   Akun        POST /api/auth/guest · GET/PATCH/DELETE /api/me
//   Komunitas   GET/POST /api/posts · GET/DELETE /api/posts/:id · POST /api/posts/:id/{like,save,comments,report}
//               DELETE /api/comments/:id · POST /api/users/:id/block
//   Data        GET /api/foods(/:id) · GET /api/content(/:id)
//   Tantangan   GET /api/challenges/current?from=YYYY-MM-DD · POST /api/challenges/:id/{checkin,remind}
//   Rencana     POST /api/agent/plan · GET /api/plan · PUT /api/plan/days
//   AI          POST /api/ai/feed · POST /api/ai/draft · POST /api/ai/replies
//   Premium     GET /api/premium · POST /api/premium/interest   (pendaftaran minat; fitur belum tersedia)
//   Akun aman   POST /api/auth/secure · POST /api/auth/login · POST /api/auth/logout
//   Notifikasi  GET /api/notifications · POST /api/notifications/read · POST /api/me/push-token
//   Moderasi    GET /admin (dasbor) · /api/admin/* (header X-Admin-Token)
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { auth, registerApi } from './api.js';
import { registerAdmin } from './admin.js';
import { registerAi } from './ai.js';
import { usesBlob } from './storage.js';
import { connectDb, initDb } from './db.js';

export const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5';

/** Kirim push lewat layanan Expo Push (gratis). Gagal diam-diam: notifikasi tetap tersimpan di kotak masuk aplikasi. */
async function expoPush(token, body, data) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: token, title: 'CalMates', body, data, sound: 'default' }),
    });
  } catch (e) {
    console.warn('Push gagal:', e?.message);
  }
}

/**
 * Membuat aplikasi Express.
 * - client: klien Anthropic (bisa tiruan saat pengujian). Tanpa client & tanpa ANTHROPIC_API_KEY → fitur AI memakai generator berbasis data.
 * - dbPath: lokasi file SQLite (':memory:' untuk tes).
 */
export function createApp({ client, model = MODEL, rateLimit = 120, dbPath, uploadsDir, adminToken, push } = {}) {
  // Koneksi dibuat langsung; tabel & data awal disiapkan di latar belakang, dan setiap permintaan menunggu sampai siap.
  const db = connectDb(dbPath);
  const ready = initDb(db);
  ready.catch((e) => console.error('Gagal menyiapkan database:', e));
  // Token admin dari .env (ADMIN_TOKEN). Kalau kosong, dibuat acak dan dicetak di terminal saat server menyala.
  const admin = adminToken || process.env.ADMIN_TOKEN || randomBytes(12).toString('hex');
  const uploads = uploadsDir || process.env.UPLOADS_DIR || new URL('../data/uploads', import.meta.url).pathname;
  const getClient = () => client ?? (process.env.ANTHROPIC_API_KEY ? (client = new Anthropic()) : null);

  const app = express();
  // Di belakang proxy hosting (Vercel/Render/Fly), pakai IP asli pengguna untuk batas permintaan.
  // Di Vercel otomatis aktif.
  if (process.env.TRUST_PROXY || process.env.VERCEL) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY || 1);
  app.set('db', db);
  app.set('adminToken', admin);
  app.use(express.json({ limit: '6mb' }));
  app.use(async (_req, _res, next) => {
    await ready;
    next();
  });
  app.set('ready', ready);

  // CORS: diperlukan agar versi web (npx expo start --web) bisa memanggil backend.
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Rate limit sederhana per IP (pakai Redis/gateway untuk produksi).
  const hits = new Map();
  app.use('/api', (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => now - t < 60_000);
    if (list.length >= rateLimit) return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar.' });
    list.push(now);
    hits.set(req.ip, list);
    next();
  });

  app.use('/uploads', express.static(uploads, { maxAge: '7d', fallthrough: false }));

  /** Kirim satu pesan ke Claude dan kembalikan teks balasannya (null bila gagal; respons error sudah dikirim). */
  const ask = async (res, { system, content, maxTokens, temperature }) => {
    try {
      const msg = await getClient().messages.create({
        model,
        max_tokens: maxTokens,
        system,
        ...(temperature !== undefined ? { temperature } : {}),
        messages: [{ role: 'user', content }],
      });
      return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    } catch (e) {
      console.error('AI error:', e?.status, e?.message);
      res.status(502).json({ error: 'Layanan AI sedang bermasalah. Coba lagi.' });
      return null;
    }
  };

  app.get('/health', async (_req, res) => {
    const n = async (t) => (await db.prepare(`SELECT count(*) n FROM ${t}`).get()).n;
    res.json({ ok: true, model, ai: Boolean(getClient()), db: { users: await n('users'), posts: await n('posts'), foods: await n('foods') }, storage: usesBlob() ? 'vercel-blob' : 'disk', database: db.remote ? 'turso' : 'file' });
  });

  registerApi(app, db, { uploadsDir: uploads, push: push === undefined ? expoPush : push });
  registerAdmin(app, db, { adminToken: admin, uploadsDir: uploads });
  registerAi(app, db, { need: auth(db), ask, hasAi: () => Boolean(getClient()) });

  app.use((_req, res) => res.status(404).json({ error: 'Tidak ditemukan' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Data terlalu besar' });
    if (err?.status === 404) return res.status(404).json({ error: 'Tidak ditemukan' });
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan di server' });
  });
  return app;
}

