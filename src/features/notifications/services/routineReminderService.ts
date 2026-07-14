import * as Notifications from 'expo-notifications';

import { i18n } from '@/i18n';

const ROUTINE_REMINDERS_CHANNEL_ID = 'routine-reminders';

export type RoutineReminder = {
  reminderMinute: number | null;
  routineId: string;
  scheduleWeekdays: readonly number[];
};

export async function synchronizeRoutineReminder(reminder: RoutineReminder): Promise<void> {
  await cancelRoutineReminder(reminder.routineId);

  if (reminder.reminderMinute === null) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const hour = Math.floor(reminder.reminderMinute / 60);
  const minute = reminder.reminderMinute % 60;
  await Promise.all(reminder.scheduleWeekdays.map((weekday) =>
    Notifications.scheduleNotificationAsync({
      content: {
        body: i18n.t('notifications:routine.body'),
        data: { route: '/(app)', routineId: reminder.routineId },
        title: i18n.t('notifications:routine.title'),
      },
      identifier: getReminderIdentifier(reminder.routineId, weekday),
      trigger: { channelId: ROUTINE_REMINDERS_CHANNEL_ID, hour, minute, type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: weekday + 1 },
    }),
  ));
}

export async function cancelRoutineReminder(routineId: string): Promise<void> {
  await Promise.all([0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    Notifications.cancelScheduledNotificationAsync(getReminderIdentifier(routineId, weekday)),
  ));
}

export async function cancelManagedRoutineReminders(): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const reminderIds = scheduledNotifications
    .map((notification) => notification.identifier)
    .filter((identifier) => identifier.startsWith('routine-reminder:'));

  await Promise.all(
    reminderIds.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

function getReminderIdentifier(routineId: string, weekday: number): string {
  return `routine-reminder:${routineId}:${weekday}`;
}
