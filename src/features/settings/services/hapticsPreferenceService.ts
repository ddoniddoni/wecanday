import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ProfileRow } from '@/lib/supabase/database.types';

export async function saveHapticsPreference(
  client: SupabaseClient<Database>,
  userId: string,
  isEnabled: boolean,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .update({ haptics_enabled: isEnabled })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('HAPTICS_PREFERENCE_SAVE_FAILED');
  }

  return data;
}
