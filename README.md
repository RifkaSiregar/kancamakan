# CalMates

MVP aplikasi **komunitas diet dan hidup sehat** (React Native + Expo SDK 58) dengan backend sendiri (Express + **SQLite**) dan fitur AI (Claude) yang memakai **database makanan dan tips hidup sehat**.

- **Gratis, langsung dipakai:** komunitas, Rencana Sehatku (agent AI), tantangan mingguan, dan database makanan.
- **Premium belum tersedia.** Fiturnya hanya ditampilkan lewat demo, dan pengguna bisa mendaftarkan minat (tersimpan di database).

## Menjalankan (2 terminal)

Butuh **Node.js 20 atau lebih baru** (versi LTS dari https://nodejs.org).

**Terminal 1: backend dan database**

```bash
cd backend
npm install
cp .env.example .env     # opsional: isi ANTHROPIC_API_KEY untuk AI sungguhan
npm run dev              # http://localhost:3000 → cek http://localhost:3000/health
```

Database dibuat otomatis di `backend/data/calmates.db` dan langsung berisi data awal: **7.965 makanan**, 22 tips, 9 konten, 4 tantangan, dan beberapa postingan dari Asisten CalMates. Foto unggahan disimpan di `backend/data/uploads/`. Untuk mereset, hapus kedua lokasi itu lalu jalankan ulang backend.

**Terminal 2: aplikasi**

```bash
cd mobile
npm ci                   # wajib dijalankan ulang setelah update (ada paket font baru)
npx expo start --web -c  # browser; atau `npx expo start -c` lalu scan QR dengan Expo Go
```

Aplikasi otomatis memanggil backend di komputer yang menjalankan Expo, pada port 3000. Tidak ada yang perlu diatur:
- **Web:** `http://localhost:3000`
- **HP (Expo Go):** `http://<IP laptop>:3000`. HP dan laptop harus di Wi-Fi yang sama. Kalau macOS menanyakan izin koneksi masuk untuk `node`, pilih **Allow**.

Kalau backend sudah di-deploy, isi `extra.apiUrl` di `mobile/app.json` (misalnya `https://api.calmates.id`), lalu jalankan ulang dengan `-c`.

> Jangan jalankan `npx expo install --fix`, `npm install expo`, atau `npm update` tanpa alasan khusus, karena bisa mengganti versi Expo. Cek dengan `grep '"expo"' mobile/package.json`: hasilnya harus `~58.0.20`.

### Tanpa API key

Semua fitur tetap jalan. Fitur AI memakai **generator berbasis database** (tips, info makanan, dan aturan), bukan Claude. Setelah `ANTHROPIC_API_KEY` diisi di `backend/.env` dan backend dijalankan ulang, konten dibuat oleh Claude. Label di aplikasi menyesuaikan ("Asisten · AI" vs "Asisten").

## Database makanan

| Sumber | Jumlah | Satuan | Keterangan |
|---|---|---|---|
| Kurasi CalMates (`backend/data/foods.js`) | 74 | per porsi umum | Hidangan sehari-hari dengan tips. Tampil paling atas. |
| TKPI, Kemenkes RI (panganku.org) | 1.146 | per 100 g | Lewat dataset [intanypurbasari/food-nutrition](https://github.com/intanypurbasari/food-nutrition) (MIT) |
| USDA FoodData Central SR Legacy | 6.745 | per 100 g | Domain publik. Nama berbahasa Inggris. Tanpa produk babi, alkohol, dan makanan bayi. |

- Pencarian mencocokkan nama Indonesia dan Inggris. Sinonim seperti "ayam" juga menemukan "chicken" di USDA.
- Hasil kurasi dan TKPI selalu tampil lebih dulu.
- Tag (tinggi protein, tinggi serat, rendah lemak, manis, digoreng) dibuat otomatis dari nilai per 100 g.
- Halaman detail punya pengatur porsi 50/100/150/200 g untuk data per 100 g.
- AI hanya memakai data kurasi dan TKPI sebagai konteks.

Memperbarui data TKPI/USDA:

```bash
git clone https://github.com/intanypurbasari/food-nutrition /tmp/food-nutrition
cd backend && node scripts/import-foods.mjs /tmp/food-nutrition   # menulis data/foods_tkpi.json & foods_usda.json
```

## Desain

Konsep **"Dapur Nusantara"**: hangat, segar, dan menggugah selera.
- **Warna** (`mobile/src/theme.ts`): hijau daun pisang `#12724F`, kunyit `#F5B82E` (pencapaian & aksi AI), cabai `#E5484D` (suka), latar hijau-mint `#F2F7F4`.
- **Huruf:** Plus Jakarta Sans (typeface yang dirancang untuk Jakarta), dimuat lewat `@expo-google-fonts/plus-jakarta-sans`. Semua teks memakai `components/Text.tsx`, yang otomatis memilih file font sesuai ketebalan.
- **Kedalaman:** bayangan berwarna hijau lewat `shadow(level)`, radius bertingkat (hero 28 → kartu 22 → ubin 18 → tombol 16), header melengkung dengan kartu yang menumpuk di atasnya, dan tab bar mengambang dengan tombol posting di tengah.
- **Prinsip UI/UX:** target sentuh minimal 44 px, umpan balik saat ditekan (`Tap`), skeleton loading, emoji topik dan makanan untuk pemindaian cepat, keadaan kosong yang mengajak bertindak, satu animasi di layar pembuka yang menghormati pengaturan "kurangi gerakan", dan cincin fokus yang terlihat untuk pengguna keyboard.

## Fitur

| Fitur | Layar | Data |
|---|---|---|
| Akun tamu (nama panggilan saja) | Onboarding | `users`, `sessions` (token di HP) |
| **Amankan akun**: nama pengguna + kata sandi → bisa **masuk dari perangkat lain** | `secure.tsx`, `onboarding/login.tsx` | `users.handle`, `users.pass_hash` (scrypt), `login_log` |
| **Notifikasi**: tanggapan & suka di postinganmu, lonceng dengan jumlah baru | `notifications.tsx`, lonceng di beranda | `notifications` (+ push Expo bila ada token) |
| **Pengingat check-in harian** (pukul 07/12/19) | Profil | notifikasi lokal di HP |
| **Rencana Sehatku**: satu kalimat → agent menyusun tujuan, topik, tantangan 7 hari, ide menu (dari database makanan), serta bacaan/video | `onboarding/agent.tsx`, `plan.tsx` | `plans`, `foods`, `content` |
| Beranda komunitas: filter topik, paginasi, tarik untuk memuat ulang | `(tabs)/home.tsx` | `posts`, `likes`, `saves`, `comments` |
| Buat postingan: foto (diunggah ke server), tag makanan dari database, **rapikan dengan AI** (aktif setelah pengguna menulis minimal 8 huruf) | `compose.tsx` | `posts`, `data/uploads` |
| Detail postingan: tanggapan, **saran tanggapan AI**, hapus milik sendiri, lapor, blokir | `post/[id].tsx` | `comments`, `reports`, `blocks` |
| **Konten AI**: Asisten CalMates membuat postingan berbasis database makanan & tips | Beranda → chip ✦ Konten AI | akun bot `Asisten CalMates` |
| **Database makanan**: cari, kategori, perkiraan gizi, tips, diskusi terkait | `(tabs)/foods.tsx`, `food/[id].tsx` | `foods` |
| Tantangan mingguan berganti otomatis, check-in, papan peringkat, pengingat | `(tabs)/challenges.tsx` | `challenges`, `checkins`, `reminders` |
| Pencarian postingan & makanan | `explore.tsx` | |
| Profil: ubah nama/tujuan/topik, statistik, postinganku/tersimpan, keluar, **hapus akun** | `(tabs)/profile.tsx`, `my.tsx` | |
| **Premium (segera hadir)**: demo cara kerja + "Saya tertarik" | `promo.tsx`, `demo.tsx`, `waitlist.tsx` | `interest` |
| Aturan komunitas | `rules.tsx` | |

### AI yang membumi ke database

Setiap permintaan AI (`backend/lib/ai.js`) berjalan begini:
1. Ambil data yang relevan dari database (`lib/knowledge.js`): makanan dicocokkan berdasarkan kata dan topik, ditambah tips per topik dan daftar konten.
2. Kirim data itu di prompt sebagai **DATA MAKANAN** / **DATA TIPS**, dengan aturan: fakta hanya boleh diambil dari data ini.
3. Validasi keluaran: `food_id` harus ada di tabel `foods`, topik dan jenis harus valid, panjang teks dibatasi, dan pola berbahaya disaring (`isSafe`).
4. Batas pemakaian AI per pengguna per jam. Postingan AI selalu atas nama akun **Asisten CalMates**, tidak pernah menyamar sebagai anggota.

### Moderasi & keamanan

- Postingan dan tanggapan yang mempromosikan diet berbahaya (obat pelangsing, memuntahkan makanan, puasa ekstrem) ditolak server (`isHarmful`).
- Postingan yang dilaporkan langsung disembunyikan untuk pelapornya, dan disembunyikan untuk semua orang setelah dilaporkan 3 orang.
- **Sinyal berisiko** di cerita onboarding (misalnya "kurus banget", "muntahin makanan") membuat rencana diarahkan ke makan teratur, tanpa target berat badan, disertai kartu dukungan. Daftar polanya ada di `backend/lib/agent.js` dan perlu ditinjau ahli sebelum rilis.
- Pengguna bisa menghapus akun beserta seluruh datanya (wajib di Play Store/App Store).
- Percobaan masuk dibatasi (default 10 kali / 15 menit per IP, atur dengan `LOGIN_LIMIT`).

### Dasbor moderator

Buka **http://localhost:3000/admin** di browser, lalu masukkan token admin.

- Token diambil dari `ADMIN_TOKEN` di `backend/.env`. Kalau kosong, server membuat token acak setiap kali dijalankan dan mencetaknya di terminal.
- Isi: statistik komunitas, antrean laporan (alasan, jumlah pelapor, status disembunyikan), dan tombol **Abaikan laporan / Hapus postingan / Nonaktifkan akun**. Ada juga pencarian pengguna (aktifkan lagi akun) dan riwayat moderasi (`mod_log`).
- Akun yang dinonaktifkan langsung tidak bisa memakai aplikasi (muncul pesan alasannya) dan postingannya disembunyikan.

### Notifikasi di HP

- **Pengingat harian** adalah notifikasi lokal, berjalan di Expo Go (Android/iOS). Di browser hanya muncul pesan bahwa fitur ini khusus HP.
- **Push dari server** (saat ada yang menanggapi postinganmu dikirim lewat Expo Push API) baru aktif di *development build*/aplikasi rilis dengan `projectId` EAS. Expo Go Android tidak mendukung push jarak jauh. Tanpa push pun notifikasi tetap tercatat di layar Notifikasi.

## Struktur

```
CalMates-main/
├── mobile/                 # Aplikasi Expo (Expo Router, src/app = layar)
│   └── src/
│       ├── app/            # layar
│       ├── components/     # UI, PostCard, Sheet, Toast, Charts (demo)
│       ├── lib/            # query.ts (cache data API), types.ts
│       ├── services/api.ts # klien API + deteksi alamat backend
│       ├── data/sample.ts  # konstanta + data contoh khusus demo Premium
│       └── store.ts        # sesi login & preferensi (Zustand + AsyncStorage)
└── backend/
    ├── server.js           # titik masuk (lokal: listen, Vercel: export default)
    ├── lib/app.js          # createApp(): middleware, /health, registrasi route
    ├── lib/db.js           # klien libSQL (file lokal / Turso), skema, migrasi, seed
    ├── lib/storage.js      # foto: Vercel Blob atau disk
    ├── scripts/seed.mjs    # npm run seed: isi data referensi ke database
    ├── lib/api.js          # akun, komunitas, makanan, konten, tantangan, rencana, minat Premium
    ├── lib/admin.js        # API dasbor moderator (header X-Admin-Token)
    ├── admin/index.html    # dasbor moderator (buka /admin)
    ├── lib/ai.js           # endpoint AI + generator berbasis data (tanpa API key)
    ├── lib/agent.js        # agent Rencana Sehatku + deteksi sinyal berisiko
    ├── lib/knowledge.js    # pencarian makanan/tips untuk prompt
    ├── lib/content.js      # prompt, validasi & penyaring konten
    ├── data/               # foods.js, tips.js, content.js (seed)
    └── test/               # npm test (database di memori, Claude ditiru)
```

## API (ringkas)

| | Endpoint |
|---|---|
| Akun | `POST /api/auth/guest` · `POST /api/auth/{secure,login,logout}` · `GET/PATCH/DELETE /api/me` · `POST /api/me/push-token` |
| Notifikasi | `GET /api/notifications` · `POST /api/notifications/read` |
| Admin | `GET /admin` · `GET /api/admin/{stats,reports,users,log}` · `POST /api/admin/posts/:id/dismiss` · `DELETE /api/admin/posts/:id` · `POST /api/admin/users/:id/ban` |
| Postingan | `GET /api/posts?topic=&q=&food=&saved=1&mine=1&before=` · `POST /api/posts` · `GET/DELETE /api/posts/:id` · `POST /api/posts/:id/{like,save,comments,report}` · `DELETE /api/comments/:id` · `POST /api/users/:id/block` |
| Data | `GET /api/foods?q=&category=` · `GET /api/foods/:id` · `GET /api/content` · `GET /api/content/:id` |
| Tantangan | `GET /api/challenges/current?from=<Senin>` · `POST /api/challenges/:id/checkin` · `POST /api/challenges/:id/remind` |
| Rencana | `POST /api/agent/plan` · `GET /api/plan` · `PUT /api/plan/days` |
| AI | `POST /api/ai/feed` · `POST /api/ai/draft` · `POST /api/ai/replies` |
| Premium | `GET /api/premium` · `POST /api/premium/interest` |

Semua endpoint (kecuali makanan, konten, dan pembuatan akun) memakai header `Authorization: Bearer <token>`.

## Deploy online (semua di Vercel)

Dua proyek Vercel dari satu repo GitHub:

| Proyek | Root Directory | Isi |
|---|---|---|
| `calmates-api` | `backend` | Express sebagai Vercel Function. Database **Turso** (SQLite online), foto **Vercel Blob** |
| `calmates` | `mobile` | Aplikasi web (Expo export statis, setelan di `mobile/vercel.json`) |

1. **Turso**: buat database, lalu salin *Database URL* (`libsql://...`) dan buat *token*.
2. Isi `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` di `backend/.env` laptop, lalu `cd backend && npm run seed` (mengisi 7.965 makanan ke Turso, sekali saja).
3. **Vercel → proyek backend** (Root Directory `backend`). Environment Variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_TOKEN`, (opsional) `ANTHROPIC_API_KEY`. Setelah deploy: tab **Storage → Create → Blob** (akses *Public*) dan hubungkan ke proyek, lalu **Redeploy** (otomatis menambah `BLOB_READ_WRITE_TOKEN`). Cek `https://<api>.vercel.app/health` → `"database":"turso","storage":"vercel-blob"`.
4. **Vercel → proyek web** (Root Directory `mobile`). Environment Variable `EXPO_PUBLIC_API_URL=https://<api>.vercel.app` → Deploy.
5. Tambahkan `ALLOWED_ORIGIN=https://<web>.vercel.app` di proyek backend → Redeploy.

Catatan:
- Mengubah `EXPO_PUBLIC_API_URL` perlu **Redeploy** proyek web (nilainya ditanam saat build).
- Database Turso yang sudah terisi tidak diisi ulang otomatis. Kalau data makanan berubah, jalankan lagi `npm run seed` dari laptop.
- Lokal tetap memakai file `backend/data/calmates.db` dan folder `data/uploads` (tanpa Turso/Blob).

## Sebelum rilis publik

| Bagian | Sekarang | Disarankan |
|---|---|---|
| Hosting | Vercel + Turso + Vercel Blob (gratis, batas paket Hobby) | Pantau kuota; naik ke paket berbayar saat pengguna bertambah |
| Akun | Tamu + nama pengguna/kata sandi | Tambah pemulihan kata sandi lewat email/OTP |
| Foto | Vercel Blob (lokal: disk) | Kompres foto sebelum diunggah |
| Data gizi | 74 kurasi + 1.146 TKPI + 6.745 USDA | Verifikasi porsi lokal oleh ahli gizi sebelum dipakai untuk fitur Premium |
| Moderasi | Otomatis + laporan + dasbor `/admin` | Beberapa akun moderator dengan peran, bukan satu token |
| Notifikasi | Kotak notifikasi + pengingat lokal + push Expo | Buat development build EAS agar push jarak jauh aktif |
| Premium | Demo + daftar minat | Tracking foto, rencana menu, pembayaran (RevenueCat / Google Play Billing) |
