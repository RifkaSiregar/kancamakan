import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Alamat backend.
 * 1) EXPO_PUBLIC_API_URL (env saat build, misalnya di Vercel) atau extra.apiUrl di app.json
 * 2) Kosong → otomatis: komputer yang menjalankan `npx expo start`, port 3000.
 *    - Web: http://<host halaman>:3000
 *    - HP dengan Expo Go: http://<IP laptop>:3000 (diambil dari alamat Metro)
 */
function resolveApiUrl() {
  const fixed = (process.env.EXPO_PUBLIC_API_URL || (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl || '').replace(/\/$/, '');
  if (fixed) return fixed;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.protocol}//${window.location.hostname}:3000`;
  const host = (Constants.expoConfig?.hostUri || '').split(':')[0];
  return `http://${host || 'localhost'}:3000`;
}

export const API_URL = resolveApiUrl();

let token: string | null = null;
let onUnauthorized: ((message?: string) => void) | null = null;

export const setToken = (t: string | null) => {
  token = t;
};
export const setUnauthorizedHandler = (fn: (message?: string) => void) => {
  onUnauthorized = fn;
};

/** URL lengkap untuk berkas dari server (misalnya foto /uploads/...). */
export const fileUrl = (path: string | null | undefined) => (path ? (path.startsWith('http') ? path : `${API_URL}${path}`) : null);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown, timeoutMs = 20000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string };
    // Sesi tidak berlaku atau akun dinonaktifkan moderator → keluar.
    if ((res.status === 401 || (res.status === 403 && (json as { banned?: boolean }).banned)) && token) onUnauthorized?.(json.error);
    if (!res.ok) throw new ApiError(json.error || `Server membalas ${res.status}`, res.status);
    return json;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === 'AbortError') throw new ApiError('Server terlalu lama membalas. Coba lagi.', 0);
    throw new ApiError(`Tidak bisa terhubung ke server (${API_URL}). Pastikan backend menyala.`, 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}, timeoutMs?: number) => request<T>('POST', path, body, timeoutMs),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

export const qs = (params: Record<string, string | number | undefined | null | false>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `?${s}` : '';
};
