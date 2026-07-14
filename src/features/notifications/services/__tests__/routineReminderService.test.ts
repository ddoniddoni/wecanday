import * as Notifications from 'expo-notifications';

import {
  cancelManagedRoutineReminders,
  cancelRoutineReminder,
  synchronizeRoutineReminder,
} from '@/features/notifications/services/routineReminderService';
import { i18n } from '@/i18n';

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('routine reminder service', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      canAskAgain: true,
      granted: true,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
  });

  it('schedules one localized weekly reminder for each selected weekday', async () => {
    await synchronizeRoutineReminder({
      reminderMinute: 570,
      routineId: 'routine-1',
      scheduleWeekdays: [1, 3],
    });

    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(7);
    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, {
      content: {
        body: 'Your planned routine is ready when you are.',
        data: { route: '/(app)', routineId: 'routine-1' },
        title: 'WeCanDay',
      },
      identifier: 'routine-reminder:routine-1:1',
      trigger: {
        channelId: 'routine-reminders',
        hour: 9,
        minute: 30,
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2,
      },
    });
  });

  it('removes every managed weekday reminder for a routine', async () => {
    await cancelRoutineReminder('routine-1');

    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(7);
    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'routine-reminder:routine-1:6',
    );
  });

  it('removes only routine reminders when account data is cleared', async () => {
    mockedNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: 'routine-reminder:routine-1:1' },
      { identifier: 'unrelated-notification' },
    ] as never);

    await cancelManagedRoutineReminders();

    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'routine-reminder:routine-1:1',
    );
  });
});
