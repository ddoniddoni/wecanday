import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

const nativeSecureStorage: SupportedStorage = {
  getItem(key) {
    return SecureStore.getItemAsync(key, secureStoreOptions);
  },
  removeItem(key) {
    return SecureStore.deleteItemAsync(key, secureStoreOptions);
  },
  setItem(key, value) {
    return SecureStore.setItemAsync(key, value, secureStoreOptions);
  },
};

const webStorage: SupportedStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  removeItem: (key) => AsyncStorage.removeItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};

const serverStorage: SupportedStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

export function getAuthStorageForRuntime({
  isServer,
  platform,
}: {
  isServer: boolean;
  platform: typeof Platform.OS;
}): SupportedStorage {
  if (platform !== 'web') {
    return nativeSecureStorage;
  }

  return isServer ? serverStorage : webStorage;
}

export const authStorage = getAuthStorageForRuntime({
  isServer: typeof window === 'undefined',
  platform: Platform.OS,
});
