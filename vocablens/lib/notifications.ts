import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }
  return true;
}

export type ScheduleDailyRemindersOptions = {
  workspaceId?: string;
  skipToday?: boolean;
};

export async function scheduleDailyReminders(options: ScheduleDailyRemindersOptions = {}) {
  const { workspaceId, skipToday = false } = options;

  // Clear any existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  
  // We schedule individual local notifications for the next 14 days
  // because Expo doesn't easily support skipping a specific occurrence
  // in a repeating trigger.
  for (let i = 0; i < 14; i++) {
    const triggerDate = new Date(now);
    triggerDate.setDate(now.getDate() + i);
    triggerDate.setHours(8, 0, 0, 0);

    // If the trigger is in the past, skip it
    if (triggerDate.getTime() <= now.getTime()) {
      continue;
    }

    // Skip today if requested (e.g. user already did the challenge)
    if (skipToday && i === 0 && triggerDate.getDate() === now.getDate()) {
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '10-Vocab Challenge 🧠',
        body: 'Time for your daily vocabulary practice!',
        sound: true,
        data: {
          route: 'challenge',
          workspaceId,
          targetTab: 'play',
          targetMode: 'challenge',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

export async function cancelDailyReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
