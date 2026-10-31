import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clearCache } from './lib/query';
import type { User } from './lib/types';
import { setToken } from './services/api';

/**
 * State lokal di perangkat. Data komunitas (postingan, tantangan, rencana, dll.) ada di server,
 * di sini hanya sesi login dan preferensi tampilan.
 */
interface State {
  hydrated: boolean;
  token: string | null;
  user: User | null;
  filter: string;
  watchedDemo: boolean;
  reminder: { on: boolean; hour: number }; // pengingat check-in harian (notifikasi lokal)

  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setFilter: (f: string) => void;
  setWatchedDemo: () => void;
  setReminder: (r: { on: boolean; hour: number }) => void;
}

export const useApp = create<State>()(
  persist(
    (set) => ({
      hydrated: false,
      token: null,
      user: null,
      filter: 'Untukmu',
      watchedDemo: false,
      reminder: { on: false, hour: 7 },

      setSession: (token, user) => {
        setToken(token);
        set({ token, user, filter: 'Untukmu' });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        setToken(null);
        clearCache();
        set({ token: null, user: null, filter: 'Untukmu' });
      },
      setFilter: (filter) => set({ filter }),
      setWatchedDemo: () => set({ watchedDemo: true }),
      setReminder: (reminder) => set({ reminder }),
    }),
    {
      name: 'calmates-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ token, user, filter, watchedDemo, reminder }) => ({ token, user, filter, watchedDemo, reminder }),
      onRehydrateStorage: () => (state) => {
        setToken(state?.token ?? null);
        useApp.setState({ hydrated: true });
      },
    },
  ),
);

/** Tanggal lokal YYYY-MM-DD. */
export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Hari-hari minggu ini, Senin sampai Minggu (zona waktu perangkat). */
export const thisWeek = (now = new Date()) => {
  const d = new Date(now);
  const dow = (d.getDay() + 6) % 7; // 0 = Senin
  d.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return { key: todayKey(x), label: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i], isToday: i === dow, future: i > dow };
  });
};

/** Waktu relatif singkat, misalnya "5 menit lalu". */
export function ago(iso: string) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 172800) return 'kemarin';
  if (s < 604800) return `${Math.floor(s / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ---- toast global (tidak disimpan) ----
interface ToastState {
  msg: string;
  action?: { label: string; run: () => void };
  show: (msg: string, action?: { label: string; run: () => void }) => void;
  hide: () => void;
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export const useToast = create<ToastState>()((set) => ({
  msg: '',
  show: (msg, action) => {
    clearTimeout(toastTimer);
    set({ msg, action });
    toastTimer = setTimeout(() => set({ msg: '', action: undefined }), action ? 4000 : 2600);
  },
  hide: () => set({ msg: '', action: undefined }),
}));
export const toast = (msg: string, action?: { label: string; run: () => void }) => useToast.getState().show(msg, action);
/** Tampilkan pesan error dari pemanggilan API. */
export const toastError = (e: unknown, fallback = 'Terjadi kesalahan') => toast(e instanceof Error ? e.message : fallback);
