import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import {
  clearPushInstallationId,
  disableCurrentDevicePushToken,
  registerDevicePushToken,
} from '@/features/notifications/services/devicePushTokenService';
import { ensureSocialUpdatesNotificationChannel } from '@/features/notifications/services/notificationPermissionService';
import type { Database } from '@/lib/supabase/database.types';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-1' } } } },
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: jest.fn(),
  randomUUID: jest.fn(),
}));
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock('@/features/notifications/services/notificationPermissionService', () => ({
  ensureSocialUpdatesNotificationChannel: jest.fn(),
}));

const mockedCrypto = Crypto as jest.Mocked<typeof Crypto>;
const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedEnsureSocialChannel = ensureSocialUpdatesNotificationChannel as jest.MockedFunction<typeof ensureSocialUpdatesNotificationChannel>;
const rpc = jest.fn();
const client = { rpc } as unknown as SupabaseClient<Database>;

describe('device push token service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCrypto.digestStringAsync.mockResolvedValue(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );
    mockedSecureStore.getItemAsync.mockResolvedValue('installation-1');
    rpc.mockResolvedValue({ error: null });
  });

  it('registers a granted Android device token with a hashed installation ID', async () => {
    const originalPlatform = Platform.OS;

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[token-1]',
      type: 'expo',
    });

    await registerDevicePushToken(client, 'ko-KR');

    expect(mockedEnsureSocialChannel).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('upsert_device_push_token', {
      p_device_id_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      p_expo_push_token: 'ExponentPushToken[token-1]',
      p_locale: 'ko',
      p_platform: 'android',
    });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('does not request or store a token when permission is denied', async () => {
    const originalPlatform = Platform.OS;

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ granted: false } as never);

    await registerDevicePushToken(client, 'en');

    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('disables only the current Android installation at logout', async () => {
    const originalPlatform = Platform.OS;

    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    await disableCurrentDevicePushToken(client);

    expect(rpc).toHaveBeenCalledWith('disable_current_device_push_token', {
      p_device_id_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      p_platform: 'android',
    });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('removes the local push installation ID when an account is deleted', async () => {
    await clearPushInstallationId();

    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'wecanday:push-device-id',
    );
  });
});
