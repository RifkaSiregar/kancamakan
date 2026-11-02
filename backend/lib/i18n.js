// Dua bahasa (Indonesia & Inggris). Aplikasi mengirim header "Accept-Language: id|en".
// Pesan error ditulis dalam bahasa Indonesia di kode; middleware menerjemahkannya bila bahasa Inggris.

/** 'en' bila Accept-Language diawali "en", selain itu 'id'. */
export const langOf = (req) => (/^en\b/i.test(String(req.get('accept-language') || '')) ? 'en' : 'id');

const EN = {
  'Akun ini dinonaktifkan karena melanggar aturan komunitas.': 'This account has been disabled for breaking the community rules.',
  'Akun Asisten tidak bisa dinonaktifkan': "The Assistant account can't be disabled",
  'Atur nama pengguna dulu': 'Set a username first',
  'Batas pemakaian AI tercapai. Coba lagi nanti.': 'AI usage limit reached. Please try again later.',
  'Belum ada rencana': 'No plan yet',
  'Catatan terlalu panjang': 'The note is too long',
  'Ceritakan sedikit tentang dirimu dulu': 'Tell us a little about yourself first',
  'Data terlalu besar': 'The data is too large',
  'Draf tidak ditemukan': 'Draft not found',
  'Format foto tidak didukung': 'Photo format not supported',
  'Format video tidak didukung (pakai MP4, MOV, atau WebM)': 'Video format not supported (use MP4, MOV, or WebM)',
  'Foto rusak': 'The photo is corrupted',
  'Foto terlalu besar (maks 3 MB)': 'The photo is too large (max 3 MB)',
  'Hanya pemilik yang bisa menghapus': 'Only the owner can delete this',
  'Jenis atau topik tidak valid': 'Invalid type or topic',
  'Jenis postingan tidak valid': 'Invalid post type',
  'Kamu sudah check-in hari ini. Sampai besok!': "You've already checked in today. See you tomorrow!",
  'Kata sandi baru minimal 8 karakter': 'The new password must be at least 8 characters',
  'Kata sandi lama salah': 'The current password is incorrect',
  'Kata sandi minimal 8 karakter': 'Password must be at least 8 characters',
  'Konten tidak ditemukan': 'Content not found',
  'Layanan AI sedang bermasalah. Coba lagi.': 'The AI service is having problems. Please try again.',
  'Makanan tidak ditemukan': 'Food not found',
  'Nama ini tidak bisa dipakai': "This name can't be used",
  'Nama panggilan minimal 2 huruf': 'Nickname must be at least 2 letters',
  'Nama panggilan tidak valid': 'Invalid nickname',
  'Nama pengguna 3–20 karakter: huruf kecil, angka, titik, atau garis bawah': 'Username must be 3–20 characters: lowercase letters, numbers, dots, or underscores',
  'Nama pengguna atau kata sandi salah': 'Incorrect username or password',
  'Nama pengguna sudah dipakai. Coba yang lain.': 'That username is taken. Try another one.',
  'Parameter from (Senin, YYYY-MM-DD) wajib': 'The "from" parameter (Monday, YYYY-MM-DD) is required',
  'Pengguna ini tidak bisa diblokir': "This user can't be blocked",
  'Pengguna tidak ditemukan': 'User not found',
  'Pilih foto atau video, salah satu saja': 'Choose a photo or a video, not both',
  'Pilih foto dulu': 'Choose a photo first',
  'Pilih topik postingan dulu': 'Pick a topic for your post first',
  'Postingan berisi saran diet berbahaya dan tidak bisa dikirim.': "This post contains dangerous diet advice and can't be sent.",
  'Postingan tidak ditemukan': 'Post not found',
  'Sesi berakhir. Silakan masuk lagi.': 'Your session has ended. Please log in again.',
  'Sudah diterbitkan': 'Already published',
  'Tanggal check-in tidak valid': 'Invalid check-in date',
  'Tanggapan berisi saran diet berbahaya dan tidak bisa dikirim.': "This reply contains dangerous diet advice and can't be sent.",
  'Tanggapan kosong': 'The reply is empty',
  'Tanggapan tidak ditemukan': 'Reply not found',
  'Tantangan ini bukan tantanganmu minggu ini': "This isn't your challenge this week",
  'Tantangan tidak ditemukan': 'Challenge not found',
  'Terjadi kesalahan di server': 'Something went wrong on the server',
  'Terlalu banyak percobaan masuk. Coba lagi 15 menit lagi.': 'Too many login attempts. Try again in 15 minutes.',
  'Terlalu banyak permintaan. Coba lagi sebentar.': 'Too many requests. Please try again shortly.',
  'Tidak bisa melaporkan postingan sendiri': "You can't report your own post",
  'Tidak ditemukan': 'Not found',
  'Token push tidak valid': 'Invalid push token',
  'Token admin salah': 'Wrong admin token',
  'Topik tidak valid': 'Invalid topic',
  'Tujuan tidak dikenal': 'Unknown goal',
  'Tulis minimal 3 huruf': 'Write at least 3 letters',
  'Tulisan terlalu panjang': 'The text is too long',
  // MIN_HINT = 8 di ai.js (tes memastikan teksnya sama).
  'Tulis dulu ceritamu (minimal 8 huruf), lalu AI bantu merapikan.': 'Write your story first (at least 8 letters), then the AI will help polish it.',
  'Video rusak': 'The video is corrupted',
  'Video terlalu besar (maks 4 MB)': 'The video is too large (max 4 MB)',
  'Video tidak ditemukan. Unggah ulang videonya.': 'Video not found. Please upload it again.',
  'Waktu terbit tidak valid': 'Invalid publish time',
};

/** Terjemahkan satu pesan server (dipakai juga untuk teks push). */
export const tr = (lang, s) => (lang === 'en' ? (EN[s] ?? s) : s);

/** Middleware: set req.lang dan terjemahkan `error` di setiap respons JSON. */
export function i18n(req, res, next) {
  req.lang = langOf(req);
  if (req.lang === 'en') {
    const json = res.json.bind(res);
    res.json = (body) => json(body && typeof body.error === 'string' ? { ...body, error: tr('en', body.error) } : body);
  }
  next();
}

export const EN_MESSAGES = EN;
