import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadOnboardingPreferences,
  saveOnboardingPreferences,
} from '@/features/onboarding/data/onboardingPreferencesStorage';
import { defaultOnboardingPreferences } from '@/features/onboarding/domain/preferences';

describe('onboarding preferences storage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('persists country and language independently', async () => {
    const preferences = {
      ...defaultOnboardingPreferences,
      countryCode: 'KR',
      locale: 'en' as const,
      isComplete: true,
    };

    await saveOnboardingPreferences(preferences);

    await expect(loadOnboardingPreferences()).resolves.toEqual(preferences);
  });

  it('falls back safely when stored data is invalid', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('{invalid-json');

    await expect(loadOnboardingPreferences()).resolves.toEqual(
      defaultOnboardingPreferences,
    );
  });

  it('rejects unknown two-letter country codes', async () => {
    await expect(
      saveOnboardingPreferences({
        ...defaultOnboardingPreferences,
        countryCode: 'ZZ',
      }),
    ).rejects.toThrow();
  });
});
