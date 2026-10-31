// Tes akun aman, notifikasi, dan moderasi.  npm test
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { checkPassword, hashPassword } from '../lib/api.js';
import { createApp } from '../lib/app.js';

const pushed = [];
let t;

before(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  process.env.LOGIN_LIMIT = '5';
  const app = createApp({ dbPath: ':memory:', uploadsDir: mkdtempSync(join(tmpdir(), 'cm-')), adminToken: 'rahasia-admin', push: (to, body) => pushed.push({ to, body }) });
  const server = await new Promise((r) => {
    const s = app.listen(0, () => r(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body, token, headers = {}) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, json: await res.json().catch(() => ({})), text: res.headers.get('content-type') };
  };
  const guest = async (name) => (await call('POST', '/api/auth/guest', { name })).json;
  const admin = (method, path, body) => call(method, path, body, undefined, { 'X-Admin-Token': 'rahasia-admin' });
  t = { server, base, call, guest, admin };
});
after(() => t.server.close());

describe('kata sandi', () => {
  it('hash scrypt dan verifikasi', () => {
    const h = hashPassword('kunyit123');
    assert.match(h, /^scrypt\$/);
    assert.equal(checkPassword('kunyit123', h), true);
    assert.equal(checkPassword('salah', h), false);
  });
});

describe('akun yang bisa dipulihkan', () => {
  it('amankan akun lalu masuk dari "perangkat lain"', async () => {
    const r = await t.guest('Rani');
    assert.equal(r.user.secured, false);
    assert.equal((await t.call('POST', '/api/auth/secure', { handle: 'R!', password: 'kunyit123' }, r.token)).status, 400);
    assert.equal((await t.call('POST', '/api/auth/secure', { handle: 'rani.sehat', password: 'pendek' }, r.token)).status, 400);
    const s = await t.call('POST', '/api/auth/secure', { handle: 'Rani.Sehat', password: 'kunyit123' }, r.token);
    assert.equal(s.status, 200);
    assert.equal(s.json.user.handle, 'rani.sehat');
    assert.equal(s.json.user.secured, true);

    const other = await t.guest('Budi');
    assert.equal((await t.call('POST', '/api/auth/secure', { handle: 'rani.sehat', password: 'kunyit123' }, other.token)).status, 409);

    const login = await t.call('POST', '/api/auth/login', { handle: 'rani.sehat', password: 'kunyit123' });
    assert.equal(login.status, 200);
    assert.notEqual(login.json.token, r.token);
    assert.equal(login.json.user.id, r.user.id);
    assert.equal((await t.call('GET', '/api/me', undefined, login.json.token)).json.user.name, 'Rani');

    // ganti kata sandi butuh kata sandi lama
    assert.equal((await t.call('POST', '/api/auth/secure', { handle: 'rani.sehat', password: 'kunyit456' }, login.json.token)).status, 403);
    assert.equal((await t.call('POST', '/api/auth/secure', { handle: 'rani.sehat', password: 'kunyit456', current: 'kunyit123' }, login.json.token)).status, 200);

    // keluar menghapus sesi itu saja
    assert.equal((await t.call('POST', '/api/auth/logout', {}, login.json.token)).status, 200);
    assert.equal((await t.call('GET', '/api/me', undefined, login.json.token)).status, 401);
    assert.equal((await t.call('GET', '/api/me', undefined, r.token)).status, 200);
  });

  it('salah kata sandi dibatasi', async () => {
    let last;
    for (let i = 0; i < 6; i++) last = await t.call('POST', '/api/auth/login', { handle: 'tidak.ada', password: 'xxxxxxxx' });
    assert.equal(last.status, 429);
  });
});

describe('notifikasi', () => {
  it('tanggapan & suka memberi tahu pemilik postingan (tanpa duplikat), push terkirim bila ada token', async () => {
    const a = await t.guest('Ana');
    const b = await t.guest('Bima');
    const c = await t.guest('Cici');
    assert.equal((await t.call('POST', '/api/me/push-token', { token: 'bukan-token' }, a.token)).status, 400);
    assert.equal((await t.call('POST', '/api/me/push-token', { token: 'ExponentPushToken[abc123]' }, a.token)).status, 200);
    const p = (await t.call('POST', '/api/posts', { kind: 'Tanya', topic: 'Camilan', text: 'Camilan sore enaknya apa?' }, a.token)).json.post;

    await t.call('POST', `/api/posts/${p.id}/comments`, { text: 'Pisang rebus!' }, b.token);
    await t.call('POST', `/api/posts/${p.id}/like`, {}, b.token);
    await t.call('POST', `/api/posts/${p.id}/like`, {}, b.token); // batal suka
    await t.call('POST', `/api/posts/${p.id}/like`, {}, b.token); // suka lagi → tidak duplikat
    await t.call('POST', `/api/posts/${p.id}/comments`, { text: 'Komentar sendiri' }, a.token); // tidak memberi tahu diri sendiri
    await t.call('POST', `/api/posts/${p.id}/comments`, { text: 'Jagung rebus juga enak' }, c.token);

    const na = await t.call('GET', '/api/notifications', undefined, a.token);
    assert.equal(na.json.unread, 3); // komentar Bima, suka Bima, komentar Cici
    assert.match(na.json.notifications.at(-1).text, /Bima menanggapi postinganmu/);
    assert.equal(na.json.notifications[0].postId, p.id);
    assert.equal(pushed.filter((x) => x.to === 'ExponentPushToken[abc123]').length, 3);

    const nb = await t.call('GET', '/api/notifications', undefined, b.token);
    assert.ok(nb.json.notifications.some((n) => n.type === 'reply')); // Bima ikut diskusi → diberi tahu saat Cici menanggapi

    await t.call('POST', '/api/notifications/read', {}, a.token);
    assert.equal((await t.call('GET', '/api/notifications', undefined, a.token)).json.unread, 0);
    assert.equal((await t.call('GET', '/api/me', undefined, a.token)).json.stats.unread, 0);
  });
});

describe('moderasi', () => {
  it('halaman & token admin', async () => {
    const page = await fetch(t.base + '/admin');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Moderasi CalMates/);
    assert.equal((await t.call('GET', '/api/admin/stats', undefined, undefined, { 'X-Admin-Token': 'salah' })).status, 401);
    const s = await t.admin('GET', '/api/admin/stats');
    assert.ok(s.json.users >= 5 && s.json.foods > 7000);
  });

  it('antrean laporan → abaikan, hapus, nonaktifkan akun', async () => {
    const bad = await t.guest('Spammer');
    const good = await t.guest('Dewi');
    const p1 = (await t.call('POST', '/api/posts', { kind: 'Bagikan', topic: 'Camilan', text: 'Beli produk saya di toko sebelah' }, bad.token)).json.post;
    const p2 = (await t.call('POST', '/api/posts', { kind: 'Bagikan', topic: 'Camilan', text: 'Ubi rebus untuk camilan' }, good.token)).json.post;
    await t.call('POST', `/api/posts/${p1.id}/report`, { reason: 'spam' }, good.token);
    await t.call('POST', `/api/posts/${p2.id}/report`, { reason: 'salah lapor' }, bad.token);

    const q = await t.admin('GET', '/api/admin/reports');
    assert.equal(q.json.reports.length, 2);
    assert.deepEqual(q.json.reports.find((r) => r.postId === p1.id).reasons, ['spam']);

    assert.equal((await t.admin('POST', `/api/admin/posts/${p2.id}/dismiss`)).status, 200);
    assert.equal((await t.call('GET', `/api/posts/${p2.id}`, undefined, bad.token)).status, 200); // tampil lagi untuk pelapor

    assert.equal((await t.admin('POST', `/api/admin/users/${bad.user.id}/ban`, { banned: true })).status, 200);
    const me = await t.call('GET', '/api/me', undefined, bad.token);
    assert.equal(me.status, 403); // sesi ditolak dengan alasan
    assert.equal(me.json.banned, true);
    assert.equal((await t.call('GET', `/api/posts/${p1.id}`, undefined, good.token)).status, 404); // konten disembunyikan

    assert.equal((await t.admin('DELETE', `/api/admin/posts/${p1.id}`)).status, 200);
    assert.equal((await t.admin('GET', '/api/admin/reports')).json.reports.length, 0);
    const log = await t.admin('GET', '/api/admin/log');
    assert.deepEqual(log.json.log.map((l) => l.action).slice(0, 3), ['delete_post', 'ban', 'dismiss']);

    // akun nonaktif tidak bisa masuk lagi
    assert.equal((await t.admin('POST', `/api/admin/users/${bad.user.id}/ban`, { banned: false })).status, 200);
    const users = await t.admin('GET', '/api/admin/users?q=Spam');
    assert.equal(users.json.users[0].banned, false);
  });
});
