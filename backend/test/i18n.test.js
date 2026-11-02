// Tes dua bahasa: setiap pesan error di kode punya terjemahan Inggris.  npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { MIN_HINT } from '../lib/ai.js';
import { EN_MESSAGES } from '../lib/i18n.js';

describe('terjemahan pesan server', () => {
  it('semua pesan error punya versi Inggris', () => {
    const missing = [];
    for (const f of ['api.js', 'ai.js', 'app.js', 'agent.js', 'admin.js']) {
      const src = readFileSync(new URL(`../lib/${f}`, import.meta.url), 'utf8');
      for (const m of src.matchAll(/error: '((?:[^'\\]|\\.)*)'/g)) if (!EN_MESSAGES[m[1]]) missing.push(`${f}: ${m[1]}`);
      for (const m of src.matchAll(/return '([A-Z][^']+)';/g)) if (!EN_MESSAGES[m[1]]) missing.push(`${f}: ${m[1]}`);
    }
    const hint = `Tulis dulu ceritamu (minimal ${MIN_HINT} huruf), lalu AI bantu merapikan.`;
    if (!EN_MESSAGES[hint]) missing.push(`ai.js: ${hint}`);
    assert.deepEqual(missing, []);
  });
});

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before } from 'node:test';
import { createApp } from '../lib/app.js';

describe('API dalam bahasa Inggris', () => {
  let base, server;
  const pushed = [];
  const call = async (method, path, body, token, lang = 'en') => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept-Language': lang, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  };
  const monday = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  before(async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const app = createApp({ dbPath: ':memory:', uploadsDir: mkdtempSync(join(tmpdir(), 'cm-')), push: (to, body) => pushed.push({ to, body }) });
    server = await new Promise((r) => {
      const s = app.listen(0, () => r(s));
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  it('pesan error, tantangan, dan rencana mengikuti Accept-Language', async () => {
    assert.equal((await call('POST', '/api/auth/register', { name: 'Al', handle: 'X!', password: 'kunyit123' })).json.error, 'Username must be 3–20 characters: lowercase letters, numbers, dots, or underscores');
    assert.equal((await call('POST', '/api/auth/register', { name: 'Al', handle: 'X!', password: 'kunyit123' }, undefined, 'id')).json.error, 'Nama pengguna 3–20 karakter: huruf kecil, angka, titik, atau garis bawah');
    assert.equal((await call('GET', '/api/me')).json.error, 'Your session has ended. Please log in again.');

    const u = (await call('POST', '/api/auth/register', { name: 'Alex', handle: 'alex.eats', password: 'kunyit123', topics: ['Vegetarian'] })).json;
    const ch = (await call('GET', `/api/challenges/current?from=${monday()}`, undefined, u.token)).json;
    const chId = (await call('GET', `/api/challenges/current?from=${monday()}`, undefined, u.token, 'id')).json;
    assert.equal(ch.current.id, chId.current.id);
    assert.notEqual(ch.current.title, chId.current.title);
    assert.equal(ch.current.plan.length, 7);
    assert.ok(!/hari|makan/i.test(ch.current.plan.map((d) => d.task).join(' ')));

    const plan = (await call('POST', '/api/agent/plan', { input: 'office worker, love fried snacks, want to lose weight slowly' }, u.token)).json.plan;
    assert.match(plan.summary, /^Hi Alex!/);
    assert.equal(plan.goal, 'Menurunkan berat badan'); // nilai pilihan tetap kunci Indonesia
    assert.ok(plan.meals.every((m) => ['Sarapan', 'Makan siang', 'Makan malam'].includes(m.meal)));
    assert.ok(/with|and|Rice/.test(plan.meals.map((m) => m.idea).join(' ')));

    const care = (await call('POST', '/api/agent/plan', { input: 'I keep throwing up after I eat, I want to be really skinny' }, u.token)).json.plan;
    assert.equal(care.care, true);
    assert.equal(care.goal, 'Pola makan lebih sehat');
  });

  it('saran tanggapan & push notification dalam bahasa penerima', async () => {
    const a = (await call('POST', '/api/auth/register', { name: 'Bea', handle: 'bea.eats', password: 'kunyit123' })).json;
    const b = (await call('POST', '/api/auth/register', { name: 'Cak', handle: 'cak.makan', password: 'kunyit123' }, undefined, 'id')).json;
    await call('POST', '/api/me/push-token', { token: 'ExponentPushToken[bea]' }, a.token);
    const post = (await call('POST', '/api/posts', { topic: 'Camilan', text: 'Boiled sweet potato for my afternoon snack' }, a.token)).json.post;
    const rp = (await call('POST', '/api/ai/replies', { postId: post.id }, a.token)).json;
    assert.equal(rp.replies.length, 3);
    assert.ok(rp.replies.every((r) => /^[\x20-\x7E’]+$/.test(r)));
    await call('POST', `/api/posts/${post.id}/like`, {}, b.token, 'id');
    assert.equal(pushed.at(-1).body, 'Cak liked your post'); // penerima (Bea) memakai bahasa Inggris
  });
});
