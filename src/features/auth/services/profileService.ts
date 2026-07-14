import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import {
  loadOnboardingPreferences,
  saveOnboardingPreferences,
} from '@/features/onboarding/data/onboardingPreferencesStorage';
import { resolveSupportedLocale } from '@/i18n/types';
import type { Database, ProfileRow } from '@/lib/supabase/database.types';

export async function updateOwnDisplayName(
  client: SupabaseClient<Database>,
  userId: string,
  displayName: string,
): Promise<ProfileRow> {
  const normalizedDisplayName = displayName.trim();

  if (normalizedDisplayName.length === 0 || normalizedDisplayName.length > 30) {
    throw new AuthDomainError('INVALID_DISPLAY_NAME');
  }

  const { data, error } = await client
    .from('profiles')
    .update({ display_name: normalizedDisplayName })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new AuthDomainError('AUTH_PROFILE_UNAVAILABLE');
  }

  return data;
}

export async function loadAndSyncOwnProfile(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileRow> {
  const preferencesPromise = loadOnboardingPreferences();
  const profilePromise = client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  const [preferences, profileResult] = await Promise.all([
    preferencesPromise,
    profilePromise,
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new AuthDomainError('AUTH_PROFILE_UNAVAILABLE');
  }

  const shouldSyncPreferences =
    (profileResult.data.country_code === null && preferences.countryCode !== null) ||
    (profileResult.data.locale === null && preferences.locale !== null);

  let profile = profileResult.data;

  if (shouldSyncPreferences) {
    const { data, error } = await client
      .from('profiles')
      .update({
        country_code: profile.country_code ?? preferences.countryCode,
        locale: profile.locale ?? preferences.locale,
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new AuthDomainError('AUTH_PROFILE_UNAVAILABLE');
    }

    profile = data;
  }

  const nextPreferences = {
    ...preferences,
    countryCode: profile.country_code ?? preferences.countryCode,
    locale: profile.locale ? resolveSupportedLocale(profile.locale) : preferences.locale,
  };

  if (
    nextPreferences.countryCode !== preferences.countryCode ||
    nextPreferences.locale !== preferences.locale
  ) {
    void saveOnboardingPreferences(nextPreferences).catch(() => {
      // The profile is authoritative; a later sign-in will repair this local cache.
    });
  }

  return profile;
}
