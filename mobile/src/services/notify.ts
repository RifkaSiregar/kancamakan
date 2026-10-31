/**
 * Notifikasi di perangkat:
 * - Pengingat check-in harian: notifikasi LOKAL terjadwal (jalan di Expo Go, iOS & Android; tidak di web).
 * - Push dari server (tanggapan/suka): butuh token Expo Push. Di Expo Go Android, push jarak jauh tidak tersedia
 *   sejak SDK 53, jadi fungsi ini diam-diam dilewati; di development build / aplikasi rilis langsung berfungsi.
 *   Notifikasi tetap selalu tersimpan di kotak notifikasi aplikasi.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

const REMINDER_ID = 'checkin-harian';

/** Jadwalkan (atau batalkan) pengingat check-in setiap hari pada jam tertentu. */
export async function setDailyReminder(on: boolean, hour: number): Promise<'ok' | 'denied' | 'unsupported'> {
  if (!notificationsSupported) return 'unsupported';
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  if (!on) return 'ok';
  if (!(await ensurePermission())) return 'denied';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pengingat', { name: 'Pengingat check-in', importance: Notifications.AndroidImportance.DEFAULT });
  }
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'Waktunya check-in 🌿', body: 'Satu kebiasaan kecil hari ini. Buka CalMates dan centang tantanganmu.', data: { url: '/challenges' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: 'pengingat' },
  });
  return 'ok';
}

/** Daftarkan token push ke server (bila tersedia). Tidak melempar error. */
export async function registerPushToken() {
  if (!notificationsSupported) return;
  try {
    if (!(await ensurePermission())) return;
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (data) await api.post('/api/me/push-token', { token: data });
  } catch {
    // Expo Go Android / belum ada projectId EAS → lewati; kotak notifikasi di aplikasi tetap berjalan.
  }
}
