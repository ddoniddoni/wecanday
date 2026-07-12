import * as Notifications from 'expo-notifications';

const ROUTINE_REMINDERS_CHANNEL_ID = 'routine-reminders';

export type RoutineReminder = {
  reminderMinute: number | null;
  routineId: string;
  scheduleWeekdays: readonly number[];
};

export async function synchronizeRoutineReminder(reminder: RoutineReminder): Promise<void> {
  await cancelRoutineReminder(reminder.routineId, reminder.scheduleWeekdays);

  if (reminder.reminderMinute === null) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const hour = Math.floor(reminder.reminderMinute / 60);
  const minute = reminder.reminderMinute % 60;
  await Promise.all(reminder.scheduleWeekdays.map((weekday) =>
    Notifications.scheduleNotificationAsync({
      content: { data: { routineId: reminder.routineId }, title: 'WeCanDay' },
      identifier: getReminderIdentifier(reminder.routineId, weekday),
      trigger: { channelId: ROUTINE_REMINDERS_CHANNEL_ID, hour, minute, type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: weekday + 1 },
    }),
  ));
}

export async function cancelRoutineReminder(routineId: string, weekdays: readonly number[]): Promise<void> {
  await Promise.all([0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    Notifications.cancelScheduledNotificationAsync(getReminderIdentifier(routineId, weekday)),
  ));
}

function getReminderIdentifier(routineId: string, weekday: number): string {
  return `routine-reminder:${routineId}:${weekday}`;
}
