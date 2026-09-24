/**
 * NIRA - notifikasi lokal.
 *
 * Push notification tidak tersedia di Expo Go (sejak SDK 53), tapi local
 * notification tetap jalan. Kita pakai scheduleNotificationAsync dengan
 * trigger null (langsung muncul) atau time interval (dreamde 1.5 detik
 * supaya terasa di demo).
 */
import * as Notifications from './expo-notifications';
import { Platform } from 'react-native';

let configured = false;

/** Wajib dipanggil sekali di mount — set handler yang menampilkan banner. */
export function initNotifications() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('nira', {
      name: 'NIRA',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function notify(
  title: string,
  body: string,
  delay: number = 0,
) {
  try {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { app: 'nira' } },
      trigger: delay ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delay } : null,
    });
  } catch {
    /* Expo Go atau web — abaikan */
  }
}

/** Minta izin notifikasi (Android auto-grant; iOS perlu prompt). */
export async function requestNotificationPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}