import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  defaultOnboardingPreferences,
  type OnboardingPreferences,
  onboardingPreferencesSchema,
} from '@/features/onboarding/domain/preferences';

const ONBOARDING_PREFERENCES_KEY =
  '@wecanday/onboarding-preferences:v1';

export async function loadOnboardingPreferences(): Promise<OnboardingPreferences> {
  const storedValue = await AsyncStorage.getItem(ONBOARDING_PREFERENCES_KEY);

  if (!storedValue) {
    return defaultOnboardingPreferences;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    const result = onboardingPreferencesSchema.safeParse(parsedValue);

    return result.success ? result.data : defaultOnboardingPreferences;
  } catch {
    return defaultOnboardingPreferences;
  }
}

export async function saveOnboardingPreferences(
  preferences: OnboardingPreferences,
): Promise<void> {
  const validatedPreferences = onboardingPreferencesSchema.parse(preferences);

  await AsyncStorage.setItem(
    ONBOARDING_PREFERENCES_KEY,
    JSON.stringify(validatedPreferences),
  );
}
