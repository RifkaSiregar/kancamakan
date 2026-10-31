// Jalankan: npm test   (database di memori, Claude ditiru — tidak memanggil API sungguhan)
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { needsCare, parsePlan } from '../lib/agent.js';
import { clean, isHarmful, isSafe, parseBotPosts, parseReplies } from '../lib/content.js';
import { createApp } from '../lib/app.js';

const PNG = Buffer.alloc(400, 7).toString('base64');

async function start(opts = {}) {
  const app = createApp({ dbPath: ':memory:', uploadsDir: mkdtempSync(join(tmpdir(), 'cm-')), ...opts });
  const server = await new Promise((r) => {
    const s = app.listen(0, () => r(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, json };
  };
  const guest = async (name) => (await call('POST', '/api/auth/guest', { name })).json;
  return { server, base, call, guest, db: app.get('db') };
}

function fakeClient(handler) {
  const calls = [];
  return { calls, messages: { create: async (req) => (calls.push(req), { content: [{ type: 'text', text: handler(req) }] }) } };
}

const monday = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

describe('pembersih & pengaman', () => {
  it('clean memotong dan merapikan', () => {
    assert.equal(clean('  Enak   banget #diet  ', 100), 'Enak banget');
    assert.ok(clean('kata '.repeat(100), 50).endsWith('…'));
  });
  it('isHarmful untuk konten pengguna, isSafe lebih ketat untuk AI', () => {
    assert.equal(isHarmful('coba obat pelangsing ini'), true);
    assert.equal(isHarmful('makan siang tadi sekitar 500 kalori'), false);
    assert.equal(isSafe('makan siang tadi sekitar 500 kalori'), false);
  });
  it('parseBotPosts hanya menerima food_id dari data', () => {
    const out = parseBotPosts(JSON.stringify({ posts: [{ kind: 'Resep', topic: 'Camilan', food_id: 'pisang', food_label: 'Pisang', text: 'Pisang rebus untuk camilan sore, murah dan kenyang.' }, { kind: 'X', topic: 'Camilan', food_id: 'pizza', text: 'Minum pil pelangsing biar cepat kurus ya.' }, { topic: 'Aneh', food_id: 'pizza', text: 'Siapa yang suka jagung rebus buat camilan?' }] }), { topics: ['Camilan'], foodIds: ['pisang', 'jagung-rebus'], count: 5 });
    assert.equal(out.length, 2);
    assert.equal(out[0].food_id, 'pisang');
    assert.equal(out[1].food_id, null);
    assert.equal(out[1].kind, 'Bagikan');
  });
  it('parseReplies unik maksimal 3', () => {
    assert.deepEqual(parseReplies('{"replies":["Mantap!","Mantap!","Resepnya?","Coba sayur.","x"]}'), ['Mantap!', 'Resepnya?', 'Coba sayur.']);
  });
  it('needsCare & parsePlan mode care', () => {
    assert.equal(needsCare('pengen kurus banget, kadang muntahin makanan'), true);
    assert.equal(needsCare('kerja kantoran suka gorengan'), false);
    const plan = parsePlan(JSON.stringify({ goal: 'Menurunkan berat badan', summary: 'Halo, kita mulai pelan-pelan.', challenge: { days: ['a1a', 'b2b', 'c3c', 'd4d', 'e5e'] }, meals: [{ meal: 'Sarapan', food_id: 'oat', idea: 'Oat pisang' }, { meal: 'Brunch', idea: 'x' }], picks: ['nope'] }), { care: true, foodIds: ['oat'], contentIds: ['piring-seimbang'] });
    assert.equal(plan.goal, 'Pola makan lebih sehat');
    assert.equal(plan.challenge.days.length, 7);
    assert.deepEqual(plan.meals, [{ meal: 'Sarapan', food_id: 'oat', idea: 'Oat pisang' }]);
    assert.deepEqual(plan.picks, ['piring-seimbang']);
  });
});

describe('komunitas (tanpa AI)', () => {
  let t, rani, budi;
  before(async () => {
    delete process.env.ANTHROPIC_API_KEY;
    t = await start();
    rani = await t.guest('Rani');
    budi = await t.guest('Budi');
  });
  after(() => t.server.close());

  it('health, CORS, dan data awal', async () => {
    const r = await fetch(t.base + '/health');
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
    const h = await r.json();
    assert.equal(h.ai, false);
    assert.ok(h.db.foods >= 70);
  });

  it('akun tamu: validasi nama & token', async () => {
    assert.equal((await t.call('POST', '/api/auth/guest', { name: 'A' })).status, 400);
    assert.equal((await t.call('POST', '/api/auth/guest', { name: 'Asisten CalMates' })).status, 400);
    assert.ok(rani.token.length >= 32);
    assert.equal((await t.call('GET', '/api/me')).status, 401);
    assert.equal((await t.call('GET', '/api/me', undefined, 'salah')).status, 401);
    const me = await t.call('GET', '/api/me', undefined, rani.token);
    assert.equal(me.json.user.name, 'Rani');
    const up = await t.call('PATCH', '/api/me', { goal: 'Menjaga berat badan', topics: ['Camilan', 'xx'] }, rani.token);
    assert.deepEqual(up.json.user.topics, ['Camilan']);
  });

  it('beranda berisi postingan awal Asisten CalMates', async () => {
    const r = await t.call('GET', '/api/posts', undefined, rani.token);
    assert.equal(r.status, 200);
    assert.ok(r.json.posts.length >= 6);
    assert.equal(r.json.posts[0].author.bot, true);
    assert.ok(r.json.posts.some((p) => p.food?.id));
  });

  it('buat postingan + foto, like, simpan, tanggapan, hapus', async () => {
    const bad = await t.call('POST', '/api/posts', { kind: 'Bagikan', topic: 'Camilan', text: 'minum obat pelangsing aja' }, rani.token);
    assert.equal(bad.status, 400);
    const c = await t.call('POST', '/api/posts', { kind: 'Bagikan', topic: 'Camilan', text: 'Camilan sore pisang rebus', foodId: 'pisang', foodLabel: 'Pisang rebus', photo: PNG, photoType: 'image/png' }, rani.token);
    assert.equal(c.status, 201);
    const post = c.json.post;
    assert.equal(post.mine, true);
    assert.equal(post.food.id, 'pisang');
    assert.match(post.photo, /^\/uploads\/.+\.png$/);
    const img = await fetch(t.base + post.photo);
    assert.equal(img.status, 200);

    const like = await t.call('POST', `/api/posts/${post.id}/like`, {}, budi.token);
    assert.equal(like.json.post.likes, 1);
    assert.equal(like.json.post.liked, true);
    assert.equal((await t.call('POST', `/api/posts/${post.id}/save`, {}, budi.token)).json.post.saved, true);
    const savedList = await t.call('GET', '/api/posts?saved=1', undefined, budi.token);
    assert.deepEqual(savedList.json.posts.map((p) => p.id), [post.id]);

    assert.equal((await t.call('POST', `/api/posts/${post.id}/comments`, { text: 'Mantap!' }, budi.token)).status, 201);
    const detail = await t.call('GET', `/api/posts/${post.id}`, undefined, rani.token);
    assert.equal(detail.json.comments.length, 1);
    assert.equal(detail.json.comments[0].author.name, 'Budi');
    assert.equal(detail.json.post.comments, 1);

    // filter & cari
    assert.ok((await t.call('GET', '/api/posts?topic=Camilan', undefined, rani.token)).json.posts.every((p) => p.topic === 'Camilan'));
    assert.ok((await t.call('GET', '/api/posts?q=pisang', undefined, rani.token)).json.posts.some((p) => p.id === post.id));
    assert.ok((await t.call('GET', '/api/posts?food=pisang', undefined, rani.token)).json.posts.some((p) => p.id === post.id));

    assert.equal((await t.call('DELETE', `/api/posts/${post.id}`, undefined, budi.token)).status, 403);
    assert.equal((await t.call('DELETE', `/api/posts/${post.id}`, undefined, rani.token)).status, 200);
    assert.equal((await t.call('GET', `/api/posts/${post.id}`, undefined, rani.token)).status, 404);
    assert.equal((await fetch(t.base + post.photo)).status, 404);
  });

  it('lapor menyembunyikan untuk pelapor; 3 laporan menyembunyikan untuk semua; blokir', async () => {
    const p = (await t.call('POST', '/api/posts', { kind: 'Tanya', topic: 'Makan di luar', text: 'Warteg favorit kalian?' }, budi.token)).json.post;
    await t.call('POST', `/api/posts/${p.id}/report`, { reason: 'spam' }, rani.token);
    assert.equal((await t.call('GET', `/api/posts/${p.id}`, undefined, rani.token)).status, 404);
    for (const n of ['Cici', 'Dodi', 'Eka']) await t.call('POST', `/api/posts/${p.id}/report`, {}, (await t.guest(n)).token);
    const other = await t.guest('Fani');
    assert.equal((await t.call('GET', `/api/posts/${p.id}`, undefined, other.token)).status, 404);

    const p2 = (await t.call('POST', '/api/posts', { kind: 'Bagikan', topic: 'Camilan', text: 'Edamame enak' }, budi.token)).json.post;
    assert.equal((await t.call('POST', `/api/users/${p2.author.id}/block`, {}, rani.token)).status, 200);
    const feed = await t.call('GET', '/api/posts', undefined, rani.token);
    assert.ok(!feed.json.posts.some((x) => x.author.name === 'Budi'));
    const bot = feed.json.posts.find((x) => x.author.bot);
    assert.equal((await t.call('POST', `/api/users/${bot.author.id}/block`, {}, rani.token)).status, 400);
  });

  it('database makanan & konten', async () => {
    const all = await t.call('GET', '/api/foods');
    assert.equal(all.json.foods.length, 40); // paginasi
    assert.ok(all.json.total > 7000);
    assert.ok(all.json.counts.TKPI > 1000 && all.json.counts.USDA > 5000);
    assert.equal(all.json.foods[0].source, 'CalMates'); // kurasi tampil lebih dulu
    const page2 = await t.call('GET', `/api/foods?offset=${all.json.next}`);
    assert.notEqual(page2.json.foods[0].id, all.json.foods[0].id);
    const tk = await t.call('GET', '/api/foods?source=TKPI&q=kangkung');
    assert.ok(tk.json.foods.length > 0 && tk.json.foods.every((f) => f.source === 'TKPI'));
    const en = await t.call('GET', '/api/foods?q=chicken breast&source=USDA');
    assert.ok(en.json.foods.length > 0);
    const syn = await t.call('GET', '/api/foods?q=ayam&source=USDA');
    assert.ok(syn.json.total > 50); // "ayam" juga menemukan "chicken" di USDA
    const ayam = await t.call('GET', '/api/foods?q=ayam');
    assert.equal(ayam.json.foods[0].source, 'CalMates'); // hasil Indonesia tetap di atas
    const tkd = await t.call('GET', `/api/foods/${tk.json.foods[0].id}`);
    assert.equal(tkd.json.food.portion, '100 g');
    assert.equal(tkd.json.food.sourceLabel, 'TKPI Kemenkes');
    const q = await t.call('GET', '/api/foods?q=tempe');
    assert.ok(q.json.foods.length >= 4 && q.json.foods.every((f) => /tempe/i.test(f.name + f.nameEn + f.tags.join() + f.category)));
    assert.match(q.json.foods[0].name, /^Tempe/); // nama yang diawali kata kunci lebih dulu
    const d = await t.call('GET', '/api/foods/tempe-kukus');
    assert.equal(d.json.food.category, 'Lauk nabati');
    assert.ok(d.json.similar.length > 0);
    assert.equal((await t.call('GET', '/api/foods/pizza')).status, 404);
    const c = await t.call('GET', '/api/content/rencana-menu-mingguan');
    assert.equal(c.json.content.premium, true);
    assert.deepEqual(c.json.content.body, []);
  });

  it('tantangan: check-in, papan, pengingat', async () => {
    const from = monday();
    const cur = await t.call('GET', `/api/challenges/current?from=${from}`, undefined, rani.token);
    assert.equal(cur.status, 200);
    const id = cur.json.current.id;
    assert.equal((await t.call('POST', `/api/challenges/${id}/checkin`, { day: '2020-01-01' }, rani.token)).status, 400);
    assert.equal((await t.call('POST', `/api/challenges/${id}/checkin`, { day: today() }, rani.token)).status, 200);
    await t.call('POST', `/api/challenges/${id}/checkin`, { day: today() }, rani.token); // idempoten
    const after1 = await t.call('GET', `/api/challenges/current?from=${from}`, undefined, rani.token);
    assert.deepEqual(after1.json.days, [today()]);
    assert.equal(after1.json.board[0].me, true);
    assert.equal(after1.json.participants, 1);
    const r = await t.call('POST', `/api/challenges/${cur.json.next.id}/remind`, {}, rani.token);
    assert.equal(r.json.remind, true);
  });

  it('minat Premium', async () => {
    const r = await t.call('POST', '/api/premium/interest', {}, rani.token);
    assert.deepEqual(r.json, { interested: true, count: 1 });
    assert.equal((await t.call('GET', '/api/premium', undefined, rani.token)).json.interested, true);
  });

  it('AI tanpa API key memakai data dari database', async () => {
    const feed = await t.call('POST', '/api/ai/feed', { topic: 'Resep hemat', count: 2 }, rani.token);
    assert.equal(feed.status, 201);
    assert.equal(feed.json.ai, false);
    assert.equal(feed.json.posts.length, 2);
    assert.ok(feed.json.posts.every((p) => p.author.bot && p.topic === 'Resep hemat'));
    const empty = await t.call('POST', '/api/ai/draft', { kind: 'Resep', topic: 'Vegetarian', hint: '' }, rani.token);
    assert.equal(empty.status, 400); // AI butuh tulisan pengguna dulu
    const draft = await t.call('POST', '/api/ai/draft', { kind: 'Resep', topic: 'Vegetarian', hint: 'tempe kukus pakai kecap' }, rani.token);
    assert.ok(draft.json.text.startsWith('Tempe kukus pakai kecap'));
    assert.ok(draft.json.food_id);
    const rp = await t.call('POST', '/api/ai/replies', { postId: feed.json.posts[0].id }, rani.token);
    assert.equal(rp.json.replies.length, 3);
    const plan = await t.call('POST', '/api/agent/plan', { input: 'kerja kantoran, sering makan di warteg, mau turun berat badan' }, rani.token);
    assert.equal(plan.status, 200);
    assert.equal(plan.json.plan.goal, 'Menurunkan berat badan');
    assert.equal(plan.json.plan.topics[0], 'Makan di luar');
    assert.equal(plan.json.plan.challenge.days.length, 7);
    assert.ok(plan.json.plan.meals.every((m) => m.food_id));
    const saved = await t.call('GET', '/api/plan', undefined, rani.token);
    assert.equal(saved.json.plan.challenge.title, plan.json.plan.challenge.title);
    assert.deepEqual((await t.call('PUT', '/api/plan/days', { days: [0, 2, 2, 9] }, rani.token)).json.days, [0, 2]);
    assert.equal((await t.call('GET', '/api/me', undefined, rani.token)).json.user.goal, 'Menurunkan berat badan');
    const care = await t.call('POST', '/api/agent/plan', { input: 'aku pengen kurus banget, sering muntahin makanan' }, budi.token);
    assert.equal(care.json.plan.care, true);
    assert.equal(care.json.plan.goal, 'Pola makan lebih sehat');
  });

  it('hapus akun menghapus datanya', async () => {
    const z = await t.guest('Zaki');
    const p = (await t.call('POST', '/api/posts', { kind: 'Bagikan', topic: 'Camilan', text: 'Postingan Zaki' }, z.token)).json.post;
    assert.equal((await t.call('DELETE', '/api/me', undefined, z.token)).status, 200);
    assert.equal((await t.call('GET', '/api/me', undefined, z.token)).status, 401);
    assert.equal((await t.call('GET', `/api/posts/${p.id}`, undefined, rani.token)).status, 404);
  });
});

describe('AI dengan Claude (ditiru)', () => {
  let t, u;
  const client = fakeClient((req) => {
    if (req.system.includes('Asisten CalMates')) return JSON.stringify({ posts: [{ kind: 'Resep', topic: 'Vegetarian', food_id: 'tempe-kukus', food_label: 'Tempe kukus', text: 'Tempe kukus kecap: kukus tempe 10 menit, siram kecap dan cabai rawit.' }, { kind: 'Tanya', topic: 'Vegetarian', food_id: 'burger', food_label: 'x', text: 'Pil pelangsing ampuh nggak sih?' }] });
    if (req.system.includes('menyarankan tanggapan')) return '{"replies":["Kelihatannya enak!","Pakai kecap apa?","Coba tambah sayur."]}';
    if (req.system.includes('agent onboarding')) return JSON.stringify({ goal: 'Menjaga berat badan', topics: ['Rendah gula'], summary: 'Halo Sari! Kita kurangi gula pelan-pelan.', focus: ['Kurangi gula'], challenge: { title: '7 hari kurangi gula', days: ['Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh'] }, meals: [{ meal: 'Sarapan', food_id: 'oat', idea: 'Oat dengan pisang' }], picks: ['kurangi-gula'] });
    return JSON.stringify({ food_id: 'oat', food_label: 'Oat pisang', text: 'Sarapan oat dengan pisang, hangat dan kenyang sampai siang.' });
  });
  before(async () => {
    t = await start({ client });
    u = await t.guest('Sari');
  });
  after(() => t.server.close());

  it('feed: prompt berisi DATA dari database, keluaran disaring', async () => {
    const r = await t.call('POST', '/api/ai/feed', { topic: 'Vegetarian', count: 2 }, u.token);
    assert.equal(r.status, 201);
    assert.equal(r.json.ai, true);
    assert.equal(r.json.posts.length, 1);
    assert.equal(r.json.posts[0].food.id, 'tempe-kukus');
    assert.equal(r.json.posts[0].ai, true);
    assert.match(client.calls.at(-1).system, /DATA MAKANAN[\s\S]*tempe/i);
  });
  it('draft & replies & plan', async () => {
    const d = await t.call('POST', '/api/ai/draft', { kind: 'Bagikan', topic: 'Rendah gula', hint: 'sarapan oat' }, u.token);
    assert.equal(d.json.ai, true);
    assert.equal(d.json.food_id, 'oat');
    assert.match(client.calls.at(-1).messages[0].content, /sarapan oat/);
    const posts = (await t.call('GET', '/api/posts', undefined, u.token)).json.posts;
    const rp = await t.call('POST', '/api/ai/replies', { postId: posts[0].id }, u.token);
    assert.deepEqual(rp.json.replies.length, 3);
    const p = await t.call('POST', '/api/agent/plan', { input: 'suka kopi susu tiap hari, mau kurangi gula' }, u.token);
    assert.equal(p.json.plan.ai, true);
    assert.equal(p.json.plan.meals[0].food_id, 'oat');
    assert.match(client.calls.at(-1).system, /DATA BACAAN/);
  });
  it('batas pemakaian AI per pengguna', async () => {
    const v = await t.guest('Vina');
    let last;
    for (let i = 0; i < 7; i++) last = await t.call('POST', '/api/ai/feed', {}, v.token);
    assert.equal(last.status, 429);
  });
  it('error AI → 502', async () => {
    const bad = await start({ client: { messages: { create: async () => { throw new Error('boom'); } } } });
    const g = await bad.guest('Wati');
    assert.equal((await bad.call('POST', '/api/ai/draft', { kind: 'Tanya', topic: 'Camilan', hint: 'camilan sore yang sehat apa ya' }, g.token)).status, 502);
    bad.server.close();
  });
});
