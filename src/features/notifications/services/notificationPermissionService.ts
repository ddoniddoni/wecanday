import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { i18n } from '@/i18n';

const NOTIFICATION_PERMISSION_PROMPT_KEY_PREFIX =
  'wecanday:notification-permission-prompt:';
const ROUTINE_REMINDERS_CHANNEL_ID = 'routine-reminders';

export type NotificationPermissionResult = 'denied' | 'granted';

export async function shouldShowNotificationPermissionPrimer(
  userId: string,
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(getPromptKey(userId));

    return value === null;
  } catch {
    return false;
  }
}

export async function markNotificationPermissionPrimerHandled(
  userId: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(getPromptKey(userId), 'handled');
  } catch {
    // A storage failure must not block the user's path into the app.
  }
}

export async function requestRoutineNotificationPermission(): Promise<NotificationPermissionResult> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ROUTINE_REMINDERS_CHANNEL_ID, {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: i18n.t('notifications:channelName'),
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) {
    return 'granted';
  }

  if (!currentPermission.canAskAgain) {
    return 'denied';
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return requestedPermission.granted ? 'granted' : 'denied';
}

function getPromptKey(userId: string): string {
  return `${NOTIFICATION_PERMISSION_PROMPT_KEY_PREFIX}${userId}`;
}
