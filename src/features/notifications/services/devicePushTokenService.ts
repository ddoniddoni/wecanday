import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { ensureSocialUpdatesNotificationChannel } from '@/features/notifications/services/notificationPermissionService';
import { resolveSupportedLocale } from '@/i18n/types';
import type { Database } from '@/lib/supabase/database.types';

const PUSH_DEVICE_ID_KEY = 'wecanday:push-device-id';

type PushPlatform = 'android' | 'ios';

export async function registerDevicePushToken(
  client: SupabaseClient<Database>,
  locale: string | null | undefined,
): Promise<void> {
  const platform = getPushPlatform();

  if (!platform) {
    return;
  }

  const permission = await Notifications.getPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  const projectId = getEasProjectId();

  if (!projectId) {
    return;
  }

  await ensureSocialUpdatesNotificationChannel();

  const [deviceIdHash, token] = await Promise.all([
    getDeviceIdHash(),
    Notifications.getExpoPushTokenAsync({ projectId }),
  ]);
  const { error } = await client.rpc('upsert_device_push_token', {
    p_device_id_hash: deviceIdHash,
    p_expo_push_token: token.data,
    p_locale: resolveSupportedLocale(locale),
    p_platform: platform,
  });

  if (error) {
    throw new Error('PUSH_TOKEN_REGISTRATION_FAILED');
  }
}

export async function disableCurrentDevicePushToken(
  client: SupabaseClient<Database>,
): Promise<void> {
  const platform = getPushPlatform();

  if (!platform) {
    return;
  }

  const { error } = await client.rpc('disable_current_device_push_token', {
    p_device_id_hash: await getDeviceIdHash(),
    p_platform: platform,
  });

  if (error) {
    throw new Error('PUSH_TOKEN_DISABLE_FAILED');
  }
}

export async function clearPushInstallationId(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_DEVICE_ID_KEY);
}

function getEasProjectId(): string | null {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  return typeof projectId === 'string' ? projectId : null;
}

async function getDeviceIdHash(): Promise<string> {
  let installationId = await SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY);

  if (!installationId) {
    installationId = Crypto.randomUUID();
    await SecureStore.setItemAsync(PUSH_DEVICE_ID_KEY, installationId);
  }

  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    installationId,
  );
}

function getPushPlatform(): PushPlatform | null {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return Platform.OS;
  }

  return null;
}
