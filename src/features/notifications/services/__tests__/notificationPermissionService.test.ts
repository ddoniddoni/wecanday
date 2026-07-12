import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  markNotificationPermissionPrimerHandled,
  requestRoutineNotificationPermission,
  shouldShowNotificationPermissionPrimer,
} from '@/features/notifications/services/notificationPermissionService';

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('notificationPermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks whether the first-routine permission primer was already handled', async () => {
    mockedAsyncStorage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('handled');

    expect(await shouldShowNotificationPermissionPrimer('user-1')).toBe(true);

    await markNotificationPermissionPrimerHandled('user-1');

    expect(await shouldShowNotificationPermissionPrimer('user-1')).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'wecanday:notification-permission-prompt:user-1',
      'handled',
    );
  });

  it('creates the Android reminder channel before requesting permission', async () => {
    const originalPlatform = Platform.OS;

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      canAskAgain: true,
      granted: false,
    } as never);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({
      canAskAgain: false,
      granted: true,
    } as never);

    await expect(requestRoutineNotificationPermission()).resolves.toBe('granted');

    expect(mockedNotifications.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(
      mockedNotifications.setNotificationChannelAsync.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mockedNotifications.requestPermissionsAsync.mock.invocationCallOrder[0],
    );
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });
});
