import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { EN } from './en';

/**
 * Dua bahasa: Indonesia (bawaan) dan Inggris.
 * Teks Indonesia sekaligus menjadi kunci: t('Masuk') → "Log in" bila bahasa Inggris, atau "Masuk" bila Indonesia.
 * Teks yang belum ada di EN otomatis tampil dalam bahasa Indonesia. Cek kelengkapan: `npm run check:i18n`.
 */
export type Lang = 'id' | 'en';

/** Bahasa HP saat pertama kali dibuka: Inggris bila HP berbahasa Inggris, selain itu Indonesia. */
const deviceLang = (): Lang => {
  try {
    return getLocales()[0]?.languageCode === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
};

interface LangState {
  lang: Lang;
  hydrated: boolean;
  setLang: (l: Lang) => void;
}

export const useLang = create<LangState>()(
  persist(
    (set) => ({ lang: deviceLang(), hydrated: false, setLang: (lang) => set({ lang }) }),
    {
      name: 'kancamakan-lang',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ lang }) => ({ lang }),
      onRehydrateStorage: () => () => useLang.setState({ hydrated: true }),
    },
  ),
);

export const getLang = () => useLang.getState().lang;
/** Locale untuk tanggal & angka. */
export const locale = () => (getLang() === 'en' ? 'en-US' : 'id-ID');

/** Terjemahkan teks Indonesia ke bahasa aktif. Variabel ditulis {nama}: t('Halo, {name}!', { name }). */
export function t(id: string, vars?: Record<string, string | number>) {
  let s = getLang() === 'en' ? (EN[id] ?? id) : id;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Pakai di komponen agar ikut berganti saat bahasa diubah. */
export function useT() {
  useLang((s) => s.lang);
  return t;
}

/** Nama makanan sesuai bahasa: nama Inggris bila ada dan bahasa Inggris aktif. */
export const foodName = (f: { name: string; nameEn?: string | null }) => (getLang() === 'en' && f.nameEn ? f.nameEn : f.name);
/** Nama dalam bahasa lainnya (ditampilkan kecil di bawah judul), atau '' bila sama/tidak ada. */
export const foodAltName = (f: { name: string; nameEn?: string | null }) => {
  if (!f.nameEn) return '';
  return getLang() === 'en' ? f.name : f.nameEn;
};

// Satuan porsi makanan kurasi, misalnya "1 mangkuk (200 g)" → "1 bowl (200 g)". Urutan penting: frasa panjang dulu.
const PORTION_EN: [RegExp, string][] = [
  [/potong besar/g, 'large piece'], [/potong paha/g, 'thigh piece'], [/buah sedang/g, 'medium piece'], [/mangkuk kecil/g, 'small bowl'], [/gelas besar/g, 'large glass'],
  [/centong/g, 'scoop'], [/porsi/g, 'serving'], [/potong/g, 'piece'], [/buah/g, 'piece'], [/tongkol/g, 'cob'], [/lembar/g, 'slice'], [/sdm/g, 'tbsp'],
  [/butir/g, 'whole'], [/ekor/g, 'whole fish'], [/bungkus/g, 'pack'], [/mangkuk/g, 'bowl'], [/piring/g, 'plate'], [/gelas/g, 'glass'], [/cangkir/g, 'cup'], [/tusuk/g, 'skewers'],
];
export const portionText = (p: string) => (getLang() === 'en' ? PORTION_EN.reduce((s, [re, en]) => s.replace(re, en), p) : p);
