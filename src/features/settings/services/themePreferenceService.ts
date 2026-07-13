import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ProfileRow } from '@/lib/supabase/database.types';
import type { ThemePreference } from '@/theme/types';

export async function saveThemePreference(
  client: SupabaseClient<Database>,
  userId: string,
  preference: ThemePreference,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .update({ theme_id: preference })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('THEME_PREFERENCE_SAVE_FAILED');
  }

  return data;
}
