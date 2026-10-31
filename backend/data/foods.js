// Database makanan awal: makanan Indonesia sehari-hari.
// Angka gizi adalah PERKIRAAN per porsi umum (dirangkum dari referensi gizi umum seperti TKPI dan label pangan),
// hanya untuk informasi komunitas. Ganti/verifikasi dengan Tabel Komposisi Pangan Indonesia (TKPI) sebelum dipakai untuk tracking.
//
// Kolom: [id, nama, kategori, porsi, kkal, protein g, lemak g, karbo g, serat g, tag (dipisah koma), tips]

export const CATEGORIES = ['Makanan pokok', 'Lauk hewani', 'Lauk nabati', 'Sayur', 'Buah', 'Hidangan warung', 'Jajanan & camilan', 'Minuman', 'Susu & olahan', 'Kacang & biji', 'Bumbu & saus', 'Minyak & lemak', 'Hidangan internasional'];

export const FOODS = [
  // Makanan pokok
  ['nasi-putih', 'Nasi putih', 'Makanan pokok', '1 centong (100 g)', 130, 2.4, 0.2, 28.6, 0.4, 'pokok', 'Isi seperempat piring saja, sisanya lauk dan sayur.'],
  ['nasi-merah', 'Nasi merah', 'Makanan pokok', '1 centong (100 g)', 110, 2.6, 0.9, 23, 1.8, 'pokok,tinggi serat', 'Seratnya lebih tinggi dari nasi putih, bikin kenyang lebih lama.'],
  ['nasi-uduk', 'Nasi uduk', 'Makanan pokok', '1 porsi (150 g)', 280, 6, 9, 42, 1, 'pokok,santan', 'Dimasak dengan santan. Imbangi dengan lauk bakar dan sayur.'],
  ['lontong', 'Lontong', 'Makanan pokok', '3 potong (100 g)', 140, 2, 0.3, 31, 0.5, 'pokok', 'Setara nasi. Kalau makan lontong sayur, tidak perlu tambah nasi.'],
  ['kentang-rebus', 'Kentang rebus', 'Makanan pokok', '1 buah sedang (150 g)', 130, 3, 0.2, 30, 2.7, 'pokok,hemat', 'Direbus atau dikukus lebih ringan dibanding digoreng.'],
  ['ubi-rebus', 'Ubi jalar rebus', 'Makanan pokok', '1 buah sedang (100 g)', 120, 1, 0.3, 28, 3, 'pokok,tinggi serat,hemat', 'Manis alami, cocok untuk sarapan atau camilan.'],
  ['singkong-rebus', 'Singkong rebus', 'Makanan pokok', '1 potong (100 g)', 150, 1, 0.3, 36, 1.8, 'pokok,hemat', 'Pengganti nasi yang murah. Pilih direbus, bukan digoreng.'],
  ['jagung-rebus', 'Jagung rebus', 'Makanan pokok', '1 tongkol (100 g)', 110, 3.4, 1.5, 22, 2.7, 'pokok,tinggi serat,camilan,hemat', 'Bisa jadi camilan sore yang mengenyangkan.'],
  ['roti-gandum', 'Roti gandum', 'Makanan pokok', '2 lembar (60 g)', 150, 7, 2, 26, 4, 'pokok,tinggi serat,sarapan', 'Pasangkan dengan telur untuk sarapan praktis.'],
  ['oat', 'Oat', 'Makanan pokok', '4 sdm (40 g)', 150, 5, 3, 27, 4, 'pokok,tinggi serat,sarapan,rendah gula', 'Seduh dengan susu tawar, beri pisang sebagai pemanis alami.'],

  // Lauk hewani
  ['telur-rebus', 'Telur rebus', 'Lauk hewani', '1 butir (55 g)', 77, 6.3, 5.3, 0.6, 0, 'tinggi protein,hemat,sarapan', 'Sumber protein murah dan praktis untuk bekal.'],
  ['telur-dadar', 'Telur dadar', 'Lauk hewani', '1 butir', 150, 7, 12, 1, 0, 'tinggi protein,digoreng,hemat', 'Pakai minyak sedikit di wajan antilengket, tambah sayur iris.'],
  ['dada-ayam-rebus', 'Dada ayam rebus', 'Lauk hewani', '1 potong (100 g)', 165, 31, 3.6, 0, 0, 'tinggi protein,meal prep', 'Rebus lalu suwir untuk stok bekal beberapa hari.'],
  ['ayam-goreng', 'Ayam goreng', 'Lauk hewani', '1 potong paha (100 g)', 260, 25, 16, 3, 0, 'tinggi protein,digoreng', 'Kulitnya menyimpan banyak minyak. Boleh dilepas kalau mau lebih ringan.'],
  ['ayam-bakar', 'Ayam bakar', 'Lauk hewani', '1 potong (100 g)', 200, 27, 9, 3, 0, 'tinggi protein,dibakar', 'Pilihan lauk warung yang lebih ringan dari ayam goreng.'],
  ['ikan-kembung-bakar', 'Ikan kembung bakar', 'Lauk hewani', '1 ekor (100 g)', 150, 22, 6, 0, 0, 'tinggi protein,dibakar,hemat', 'Ikan lokal yang murah dan kaya protein.'],
  ['ikan-nila-bakar', 'Ikan nila bakar', 'Lauk hewani', '1 ekor (120 g)', 160, 28, 5, 0, 0, 'tinggi protein,dibakar', 'Cocok dengan sambal dan lalapan.'],
  ['lele-goreng', 'Lele goreng', 'Lauk hewani', '1 ekor (100 g)', 240, 18, 17, 4, 0, 'tinggi protein,digoreng,warung', 'Pecel lele lebih seimbang dengan lalapan yang banyak.'],
  ['udang-rebus', 'Udang rebus', 'Lauk hewani', '100 g', 100, 20, 1.5, 0.5, 0, 'tinggi protein', 'Cepat matang, enak ditumis dengan sayur.'],
  ['rendang', 'Rendang daging', 'Lauk hewani', '1 potong (75 g)', 195, 15, 13, 5, 1, 'tinggi protein,santan,warung', 'Cukup satu potong dan banyakkan sayur di piring.'],

  // Lauk nabati
  ['tempe-goreng', 'Tempe goreng', 'Lauk nabati', '2 potong (50 g)', 170, 10, 12, 5, 1, 'tinggi protein,digoreng,hemat', 'Coba dipanggang atau dikukus sesekali.'],
  ['tempe-bacem', 'Tempe bacem', 'Lauk nabati', '2 potong (50 g)', 160, 9, 7, 14, 1, 'tinggi protein,manis,hemat', 'Bumbunya manis dari gula merah, nikmati secukupnya.'],
  ['tempe-kukus', 'Tempe kukus', 'Lauk nabati', '2 potong (50 g)', 100, 10, 4, 5, 1.4, 'tinggi protein,hemat,meal prep', 'Cara masak paling ringan untuk tempe.'],
  ['tempe-orek', 'Tempe orek', 'Lauk nabati', '1 porsi (50 g)', 150, 9, 8, 10, 1, 'tinggi protein,hemat,meal prep', 'Tahan beberapa hari di kulkas, cocok untuk bekal.'],
  ['tahu-goreng', 'Tahu goreng', 'Lauk nabati', '2 potong (80 g)', 140, 9, 10, 3, 0.5, 'tinggi protein,digoreng,hemat', 'Tiriskan minyak dengan tisu dapur.'],
  ['tahu-kukus', 'Tahu kukus', 'Lauk nabati', '1 potong besar (100 g)', 80, 8, 5, 2, 0.3, 'tinggi protein,hemat', 'Lembut dan ringan, enak dengan kecap dan cabai.'],
  ['pepes-tahu', 'Pepes tahu', 'Lauk nabati', '1 bungkus (100 g)', 110, 9, 6, 4, 1, 'tinggi protein,dikukus,hemat', 'Dikukus dalam daun pisang tanpa minyak.'],
  ['edamame', 'Edamame rebus', 'Lauk nabati', '1 mangkuk kecil (100 g)', 120, 11, 5, 9, 5, 'tinggi protein,tinggi serat,camilan', 'Camilan kantor yang mengenyangkan.'],

  // Sayur
  ['bayam-bening', 'Sayur bayam bening', 'Sayur', '1 mangkuk', 35, 3, 0.5, 5, 2.5, 'sayur,hemat', 'Sayur berkuah ringan, cocok untuk makan malam.'],
  ['tumis-kangkung', 'Tumis kangkung', 'Sayur', '1 porsi (100 g)', 90, 3, 6, 6, 2.5, 'sayur,hemat', 'Pakai minyak sedikit saja, kangkung cepat layu.'],
  ['sayur-asem', 'Sayur asem', 'Sayur', '1 mangkuk', 70, 2, 1, 13, 3, 'sayur,hemat', 'Isinya banyak sayur dan segar, pilihan bagus di warteg.'],
  ['sayur-lodeh', 'Sayur lodeh', 'Sayur', '1 mangkuk', 130, 4, 9, 10, 3, 'sayur,santan', 'Pakai santan encer agar lebih ringan.'],
  ['capcay', 'Capcay', 'Sayur', '1 porsi (150 g)', 120, 5, 6, 10, 3, 'sayur', 'Banyak warna sayur dalam satu piring.'],
  ['tumis-buncis', 'Tumis buncis', 'Sayur', '1 porsi', 80, 2, 5, 7, 3, 'sayur,meal prep', 'Tetap renyah untuk bekal sampai siang.'],
  ['urap', 'Urap sayur', 'Sayur', '1 porsi', 120, 4, 6, 12, 4, 'sayur,tinggi serat', 'Kelapa parutnya beri rasa, cukup secukupnya.'],
  ['sop-sayur', 'Sop sayur', 'Sayur', '1 mangkuk', 60, 2, 1, 10, 2.5, 'sayur,hemat', 'Masak sekali banyak untuk beberapa kali makan.'],
  ['brokoli-kukus', 'Brokoli kukus', 'Sayur', '1 mangkuk (100 g)', 35, 2.8, 0.4, 7, 3, 'sayur,tinggi serat,meal prep', 'Kukus sebentar supaya warnanya tetap hijau.'],

  // Buah
  ['pisang', 'Pisang', 'Buah', '1 buah sedang (100 g)', 90, 1.1, 0.3, 23, 2.6, 'buah,camilan,hemat', 'Camilan praktis dan pemanis alami untuk oat.'],
  ['pepaya', 'Pepaya', 'Buah', '1 potong (150 g)', 60, 0.7, 0.2, 15, 2.5, 'buah,tinggi serat,hemat', 'Bagus untuk pencernaan, enak dimakan pagi hari.'],
  ['apel', 'Apel', 'Buah', '1 buah (150 g)', 80, 0.4, 0.3, 21, 3.6, 'buah,tinggi serat,camilan', 'Makan dengan kulitnya untuk serat lebih banyak.'],
  ['jeruk', 'Jeruk', 'Buah', '1 buah (100 g)', 45, 0.9, 0.1, 11, 2.4, 'buah,camilan', 'Lebih baik dimakan utuh daripada dijus dengan gula.'],
  ['semangka', 'Semangka', 'Buah', '1 potong (200 g)', 60, 1.2, 0.3, 15, 0.8, 'buah,segar', 'Segar saat cuaca panas.'],
  ['alpukat', 'Alpukat', 'Buah', '½ buah (100 g)', 160, 2, 15, 9, 7, 'buah,tinggi serat,lemak baik', 'Lemaknya baik. Nikmati tanpa susu kental manis.'],
  ['mangga', 'Mangga', 'Buah', '1 buah kecil (150 g)', 90, 1.2, 0.6, 22, 2.4, 'buah', 'Manis alami, cocok jadi pencuci mulut.'],
  ['jambu-biji', 'Jambu biji', 'Buah', '1 buah (100 g)', 68, 2.6, 1, 14, 5.4, 'buah,tinggi serat,hemat', 'Seratnya tinggi dan harganya terjangkau.'],

  // Hidangan warung
  ['soto-ayam', 'Soto ayam', 'Hidangan warung', '1 mangkuk', 240, 18, 9, 20, 1, 'warung,berkuah', 'Pilih tanpa jeroan, tambahkan sayur kalau ada.'],
  ['bakso-kuah', 'Bakso kuah', 'Hidangan warung', '1 mangkuk', 260, 15, 10, 27, 1, 'warung,berkuah', 'Kurangi mi dan gorengan pelengkap.'],
  ['bubur-ayam', 'Bubur ayam', 'Hidangan warung', '1 mangkuk', 290, 11, 8, 42, 1, 'warung,sarapan', 'Minta tambah telur, kerupuk secukupnya.'],
  ['nasi-goreng', 'Nasi goreng ayam', 'Hidangan warung', '1 piring', 500, 16, 18, 68, 2, 'warung,digoreng', 'Porsinya besar. Bisa minta setengah porsi atau dibagi dua.'],
  ['mie-goreng', 'Mie goreng', 'Hidangan warung', '1 piring', 450, 10, 18, 60, 2, 'warung,digoreng', 'Minta tambah sayur seperti sawi dan kol.'],
  ['mie-instan', 'Mie instan rebus', 'Hidangan warung', '1 bungkus', 380, 8, 14, 54, 2, 'praktis', 'Tambahkan telur dan sayur, bumbunya tidak perlu semua.'],
  ['gado-gado', 'Gado-gado', 'Hidangan warung', '1 porsi', 295, 12, 16, 25, 6, 'warung,sayur,tinggi serat', 'Minta bumbu kacang dipisah agar bisa atur sendiri.'],
  ['pecel-sayur', 'Pecel sayur', 'Hidangan warung', '1 porsi', 260, 11, 13, 26, 6, 'warung,sayur,tinggi serat', 'Sayurnya banyak. Rempeyek boleh dilewati.'],
  ['karedok', 'Karedok', 'Hidangan warung', '1 porsi', 180, 7, 10, 16, 5, 'warung,sayur,tinggi serat', 'Sayur mentah segar dengan bumbu kacang.'],
  ['ketoprak', 'Ketoprak', 'Hidangan warung', '1 porsi', 400, 14, 18, 48, 5, 'warung', 'Minta lontong setengah dan tambah tauge.'],
  ['lontong-sayur', 'Lontong sayur', 'Hidangan warung', '1 porsi', 350, 8, 15, 45, 3, 'warung,santan,sarapan', 'Kuah santannya cukup diambil secukupnya.'],
  ['sate-ayam', 'Sate ayam + bumbu kacang', 'Hidangan warung', '10 tusuk', 400, 30, 22, 18, 2, 'warung,tinggi protein,dibakar', 'Bagi berdua atau pesan 5 tusuk dengan lontong.'],

  // Jajanan & camilan
  ['bakwan', 'Bakwan sayur', 'Jajanan & camilan', '1 buah (50 g)', 140, 2, 9, 13, 1, 'gorengan,camilan', 'Cukup satu sebagai pelengkap.'],
  ['mendoan', 'Tempe mendoan', 'Jajanan & camilan', '1 potong (60 g)', 130, 6, 8, 9, 1, 'gorengan,camilan,tinggi protein', 'Gorengan dengan protein, tetap nikmati secukupnya.'],
  ['pisang-goreng', 'Pisang goreng', 'Jajanan & camilan', '1 buah (70 g)', 160, 1.5, 8, 22, 1.5, 'gorengan,camilan,manis', 'Pisang rebus atau kukus bisa jadi alternatif.'],
  ['martabak-manis', 'Martabak manis', 'Jajanan & camilan', '1 potong (70 g)', 260, 5, 12, 33, 1, 'manis,camilan', 'Enak dinikmati bersama, satu potong saja.'],
  ['kerupuk', 'Kerupuk', 'Jajanan & camilan', '1 keping (10 g)', 50, 0.5, 2.5, 6, 0, 'gorengan', 'Renyah tapi tidak mengenyangkan.'],
  ['bubur-kacang-hijau', 'Bubur kacang hijau', 'Jajanan & camilan', '1 mangkuk', 200, 7, 5, 32, 5, 'tinggi serat,manis', 'Minta gula dan santan sedikit.'],
  ['yogurt-plain', 'Yogurt plain', 'Jajanan & camilan', '1 cup (150 g)', 90, 5, 4, 7, 0, 'camilan,rendah gula,sarapan', 'Tambahkan buah potong sebagai pemanis.'],
  ['kacang-rebus', 'Kacang tanah rebus', 'Jajanan & camilan', '1 genggam (50 g)', 140, 6, 9, 6, 3, 'camilan,tinggi protein,hemat', 'Lebih ringan dari kacang goreng.'],
  ['seblak', 'Seblak', 'Jajanan & camilan', '1 porsi', 350, 8, 15, 45, 2, 'pedas,camilan', 'Tambah sayur dan telur, kurangi kerupuk dan mi.'],

  // Minuman
  ['air-putih', 'Air putih', 'Minuman', '1 gelas (250 ml)', 0, 0, 0, 0, 0, 'minuman,rendah gula', 'Siapkan botol minum supaya tidak lupa minum.'],
  ['teh-tawar', 'Teh tawar', 'Minuman', '1 gelas', 2, 0, 0, 0.5, 0, 'minuman,rendah gula', 'Pengganti es teh manis yang menyegarkan.'],
  ['es-teh-manis', 'Es teh manis', 'Minuman', '1 gelas', 100, 0, 0, 25, 0, 'minuman,manis', 'Coba pesan setengah manis dulu.'],
  ['kopi-hitam', 'Kopi hitam tanpa gula', 'Minuman', '1 cangkir', 5, 0.3, 0, 0, 0, 'minuman,rendah gula', 'Nikmati aroma kopinya tanpa tambahan gula.'],
  ['kopi-susu-aren', 'Kopi susu gula aren', 'Minuman', '1 gelas (250 ml)', 200, 5, 6, 30, 0, 'minuman,manis', 'Minta gula aren setengah atau ukuran kecil.'],
  ['susu-tawar', 'Susu sapi tawar', 'Minuman', '1 gelas (200 ml)', 120, 6.4, 6.4, 9.4, 0, 'minuman,tinggi protein,sarapan', 'Pilih yang tawar, bukan susu kental manis.'],
  ['jus-alpukat', 'Jus alpukat (gula + SKM)', 'Minuman', '1 gelas', 280, 3, 15, 35, 6, 'minuman,manis', 'Minta tanpa susu kental manis dan gula sedikit.'],
  ['boba-milk-tea', 'Boba milk tea', 'Minuman', '1 gelas besar', 350, 3, 8, 65, 0, 'minuman,manis', 'Pilih ukuran kecil dan level gula rendah.'],
];
