import type { SupabaseClient } from '@supabase/supabase-js';

import type { SupportedLocale } from '@/i18n/types';
import type { Database, ProfileRow } from '@/lib/supabase/database.types';

export async function saveLocalePreference(
  client: SupabaseClient<Database>,
  userId: string,
  locale: SupportedLocale,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .update({ locale })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('LOCALE_PREFERENCE_SAVE_FAILED');
  }

  return data;
}
