import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import { loadOnboardingPreferences } from '@/features/onboarding/data/onboardingPreferencesStorage';
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
    (preferences.countryCode &&
      preferences.countryCode !== profileResult.data.country_code) ||
    (preferences.locale && preferences.locale !== profileResult.data.locale);

  if (!shouldSyncPreferences) {
    return profileResult.data;
  }

  const { data, error } = await client
    .from('profiles')
    .update({
      country_code: preferences.countryCode,
      locale: preferences.locale,
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new AuthDomainError('AUTH_PROFILE_UNAVAILABLE');
  }

  return data;
}
