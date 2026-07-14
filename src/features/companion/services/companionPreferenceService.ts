import type { SupabaseClient } from '@supabase/supabase-js';

import type { CompanionId } from '@/features/companion/domain/companions';
import type { Database, ProfileRow } from '@/lib/supabase/database.types';

export async function saveCompanionPreference(
  client: SupabaseClient<Database>,
  userId: string,
  companionId: CompanionId,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .update({ companion_id: companionId })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('COMPANION_PREFERENCE_SAVE_FAILED');
  }

  return data;
}
