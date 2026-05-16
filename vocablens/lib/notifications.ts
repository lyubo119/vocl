import { Platform } from 'react-native';

let initialized = false;

export function areNotificationsSupportedInRuntime() {
  return true;
}

async function getNotifications() {
  return import('expo-notifications');
}

async function ensureAndroidReminderChannel(Notifications: any) {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('daily-reminders', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8A6BFF',
  });
}

export async function initializeNotifications() {
  if (initialized) return;

  const Notifications = await getNotifications();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // We only use local reminders. Disabling server-registration attempts
  // avoids noisy Expo Go push-token warnings.
  const setAutoRegistration = (Notifications as any).setAutoServerRegistrationEnabledAsync;
  if (typeof setAutoRegistration === 'function') {
    try {
      await setAutoRegistration(false);
    } catch {
      // Non-fatal on SDKs where this is unsupported.
    }
  }

  await ensureAndroidReminderChannel(Notifications);
  initialized = true;
}

export async function requestNotificationPermissions() {
  await initializeNotifications();
  const Notifications = await getNotifications();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export type ScheduleDailyRemindersOptions = {
  workspaceId?: string;
  skipToday?: boolean;
};

export async function scheduleDailyReminders(options: ScheduleDailyRemindersOptions = {}) {
  await initializeNotifications();
  const Notifications = await getNotifications();
  const { workspaceId, skipToday = false } = options;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  // Schedule the next 14 days as one-off notifications to support skip-today.
  for (let i = 0; i < 14; i++) {
    const triggerDate = new Date(now);
    triggerDate.setDate(now.getDate() + i);
    triggerDate.setHours(8, 0, 0, 0);

    if (triggerDate.getTime() <= now.getTime()) continue;
    if (skipToday && i === 0 && triggerDate.getDate() === now.getDate()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '10-Vocab Challenge',
        body: 'Time for your daily vocabulary practice!',
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'daily-reminders' } : {}),
        data: {
          route: 'challenge',
          workspaceId,
          targetTab: 'play',
          targetMode: 'challenge',
        },
      },
      trigger: triggerDate as any,
    });
  }
}

export async function cancelDailyReminders() {
  await initializeNotifications();
  const Notifications = await getNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getLastNotificationResponseAsync() {
  await initializeNotifications();
  const Notifications = await getNotifications();
  return Notifications.getLastNotificationResponseAsync();
}

export async function clearLastNotificationResponseAsync() {
  const Notifications = await getNotifications();
  await Notifications.clearLastNotificationResponseAsync();
}

export async function addNotificationResponseListener(listener: (response: any) => void) {
  await initializeNotifications();
  const Notifications = await getNotifications();
  const subscription = Notifications.addNotificationResponseReceivedListener(listener);

  return () => {
    subscription.remove();
  };
}
