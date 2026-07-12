import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAuthStorageForRuntime } from '@/lib/supabase/authStorage';

describe('Supabase auth storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not access browser storage during web server rendering', async () => {
    const storage = getAuthStorageForRuntime({
      isServer: true,
      platform: 'web',
    });

    expect(await storage.getItem('supabase.auth.token')).toBeNull();
    expect(await storage.setItem('supabase.auth.token', 'session')).toBeUndefined();
    expect(await storage.removeItem('supabase.auth.token')).toBeUndefined();

    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('persists web sessions after client hydration', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('session');
    const storage = getAuthStorageForRuntime({
      isServer: false,
      platform: 'web',
    });

    await expect(storage.getItem('supabase.auth.token')).resolves.toBe(
      'session',
    );

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('supabase.auth.token');
  });
});
