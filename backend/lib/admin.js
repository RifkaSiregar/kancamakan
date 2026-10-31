// API moderasi untuk tim CalMates. Semua endpoint memerlukan header "X-Admin-Token: <ADMIN_TOKEN>".
import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { deletePostStmts, initials, photoUrl } from './api.js';
import { removePhoto } from './storage.js';

// Dibaca sekali saat modul dimuat (ikut terbawa saat di-deploy ke Vercel).
const ADMIN_HTML = readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8');

export function registerAdmin(app, db, { adminToken, uploadsDir }) {
  const ok = (t) => {
    const a = Buffer.from(String(t || ''));
    const b = Buffer.from(adminToken);
    return a.length === b.length && timingSafeEqual(a, b);
  };
  const guard = (req, res, next) => (ok(req.get('x-admin-token')) ? next() : res.status(401).json({ error: 'Token admin salah' }));
  const log = async (action, target, note = '') => (await db.prepare('INSERT INTO mod_log (action, target, note) VALUES (?,?,?)').run(action, String(target), note));

  // Halaman dasbor (HTML statis; token dimasukkan di halaman dan disimpan di browser admin).
  app.get('/admin', (_req, res) => res.type('html').send(ADMIN_HTML));

  app.get('/api/admin/stats', guard, async (_req, res) => {
    const n = async (sql, ...p) => (await db.prepare(sql).get(...p)).n;
    const week = new Date(Date.now() - 7 * 864e5).toISOString();
    res.json({
      users: await n('SELECT count(*) n FROM users WHERE is_bot = 0'),
      secured: await n('SELECT count(*) n FROM users WHERE pass_hash IS NOT NULL'),
      banned: await n('SELECT count(*) n FROM users WHERE banned = 1'),
      newUsers7d: await n('SELECT count(*) n FROM users WHERE is_bot = 0 AND created_at >= ?', week),
      active7d: await n(
        `SELECT count(DISTINCT uid) n FROM (
           SELECT user_id uid FROM posts WHERE created_at >= ? UNION SELECT user_id FROM comments WHERE created_at >= ?
           UNION SELECT user_id FROM checkins WHERE day >= substr(?,1,10)) WHERE uid IN (SELECT id FROM users WHERE is_bot = 0)`,
        week,
        week,
        week,
      ),
      posts: await n('SELECT count(*) n FROM posts'),
      comments: await n('SELECT count(*) n FROM comments'),
      openReports: await n('SELECT count(DISTINCT post_id) n FROM reports'),
      premiumInterest: await n("SELECT count(*) n FROM interest WHERE feature = 'premium'"),
      plans: await n('SELECT count(*) n FROM plans'),
      foods: await n('SELECT count(*) n FROM foods'),
    });
  });

  // Antrean laporan: postingan yang dilaporkan, urut dari laporan terbanyak.
  app.get('/api/admin/reports', guard, async (_req, res) => {
    const rows = (await db
      .prepare(
        `SELECT p.id, p.text, p.topic, p.kind, p.photo, p.created_at, p.ai, u.id AS uid, u.name, u.banned, u.is_bot,
           count(r.id) AS reports, group_concat(r.reason, ' | ') AS reasons, max(r.created_at) AS last_report
         FROM reports r JOIN posts p ON p.id = r.post_id JOIN users u ON u.id = p.user_id
         GROUP BY p.id ORDER BY reports DESC, last_report DESC LIMIT 100`,
      )
      .all());
    res.json({
      reports: rows.map((r) => ({
        postId: r.id,
        text: r.text,
        topic: r.topic,
        kind: r.kind,
        photo: photoUrl(r.photo),
        createdAt: r.created_at,
        reports: r.reports,
        reasons: [...new Set(String(r.reasons || '').split(' | ').filter(Boolean))],
        hidden: r.reports >= 3,
        author: { id: r.uid, name: r.name, initials: initials(r.name), banned: Boolean(r.banned), bot: Boolean(r.is_bot) },
      })),
    });
  });

  // Laporan tidak terbukti → hapus laporan, postingan tampil lagi.
  app.post('/api/admin/posts/:id/dismiss', guard, async (req, res) => {
    const r = (await db.prepare('DELETE FROM reports WHERE post_id = ?').run(Number(req.params.id)));
    await log('dismiss', `post:${req.params.id}`, `${r.changes} laporan`);
    res.json({ ok: true });
  });

  app.delete('/api/admin/posts/:id', guard, async (req, res) => {
    const p = (await db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id)));
    if (!p) return res.status(404).json({ error: 'Postingan tidak ditemukan' });
    await db.batch(deletePostStmts('id = ?', [p.id]));
    await removePhoto(p.photo, uploadsDir);
    await log('delete_post', `post:${p.id}`, p.text.slice(0, 80));
    res.json({ ok: true });
  });

  // Nonaktifkan / aktifkan akun. Akun nonaktif keluar dari semua perangkat dan kontennya disembunyikan.
  app.post('/api/admin/users/:id/ban', guard, async (req, res) => {
    const u = (await db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id)));
    if (!u) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    if (u.is_bot) return res.status(400).json({ error: 'Akun Asisten tidak bisa dinonaktifkan' });
    const banned = req.body?.banned !== false;
    (await db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(banned ? 1 : 0, u.id));
    // Sesi tidak dihapus: middleware auth menolak dengan 403 + pesan, sehingga aplikasi bisa menjelaskan alasannya.
    await log(banned ? 'ban' : 'unban', `user:${u.id}`, u.name);
    res.json({ ok: true, banned });
  });

  app.get('/api/admin/users', guard, async (req, res) => {
    const q = String(req.query.q || '').trim();
    const rows = (await db
      .prepare(
        `SELECT u.*, (SELECT count(*) FROM posts WHERE user_id = u.id) AS posts,
           (SELECT count(*) FROM reports r JOIN posts p ON p.id = r.post_id WHERE p.user_id = u.id) AS reported
         FROM users u WHERE u.is_bot = 0 ${q ? 'AND (u.name LIKE ? OR u.handle LIKE ?)' : ''} ORDER BY u.id DESC LIMIT 100`,
      )
      .all(...(q ? [`%${q}%`, `%${q}%`] : [])));
    res.json({ users: rows.map((u) => ({ id: u.id, name: u.name, handle: u.handle, secured: Boolean(u.pass_hash), banned: Boolean(u.banned), posts: u.posts, reported: u.reported, createdAt: u.created_at })) });
  });

  app.get('/api/admin/log', guard, async (_req, res) => res.json({ log: (await db.prepare('SELECT * FROM mod_log ORDER BY id DESC LIMIT 100').all()) }));
}
