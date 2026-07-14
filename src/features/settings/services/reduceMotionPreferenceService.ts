import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ProfileRow } from '@/lib/supabase/database.types';

export async function saveReduceMotionPreference(
  client: SupabaseClient<Database>,
  userId: string,
  isEnabled: boolean,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .update({ reduce_motion: isEnabled })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('REDUCE_MOTION_PREFERENCE_SAVE_FAILED');
  }

  return data;
}
