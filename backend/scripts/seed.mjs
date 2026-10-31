// Isi / perbarui data referensi (ribuan makanan, tips, konten, tantangan) di database.
// Untuk Turso: isi TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN di backend/.env, lalu jalankan `npm run seed`.
import 'dotenv/config';
import { connectDb, initDb, seed } from '../lib/db.js';

const db = connectDb();
console.log(`Database: ${db.remote ? db.url : db.url.replace('file:', '')}`);
const t = Date.now();
await initDb(db, { seedData: false });
const { seeded } = await seed(db, { force: process.argv.includes('--force') });
const n = await db.prepare('SELECT count(*) n FROM foods').get();
console.log(seeded ? `Selesai: ${seeded} baris ditulis dalam ${((Date.now() - t) / 1000).toFixed(1)} detik.` : 'Data sudah versi terbaru (pakai --force untuk menulis ulang).');
console.log(`Jumlah makanan: ${n.n}`);
