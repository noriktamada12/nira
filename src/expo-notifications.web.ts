// Web: stub no-op untuk expo-notifications (ber-API sama).
// Di browser tidak ada kode native; notifikasi lokal diabaikan.
export function setNotificationHandler(_handler: any) {}

export async function setNotificationChannelAsync(_id: string, _config: any) {}

export async function getPermissionsAsync() {
  return { status: 'granted', canAskAgain: false, granted: true };
}

export async function requestPermissionsAsync() {
  return { status: 'granted', canAskAgain: false, granted: true };
}

export async function scheduleNotificationAsync(_req: any) {}

export const AndroidImportance = {
  NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5,
};

export const SchedulableTriggerInputTypes = {
  TIME_INTERVAL: 'timeInterval',
  DATE_TIME: 'dateTime',
} as const;