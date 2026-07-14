import type { SupabaseClient } from '@supabase/supabase-js';

import {
  getCompanionProgressForExperience,
  type CompanionProgress,
} from '@/features/companion/domain/progression';
import type { Database } from '@/lib/supabase/database.types';

export async function loadCompanionProgress(
  client: SupabaseClient<Database>,
): Promise<CompanionProgress> {
  const { data, error } = await client.rpc('get_companion_progress', {});

  if (error || !data?.[0]) {
    throw new Error('COMPANION_PROGRESS_LOAD_FAILED');
  }

  const progress = data[0];

  if (
    typeof progress.experience !== 'number' ||
    typeof progress.experience_in_level !== 'number' ||
    typeof progress.experience_to_next_level !== 'number' ||
    typeof progress.level !== 'number'
  ) {
    throw new Error('COMPANION_PROGRESS_LOAD_FAILED');
  }

  return {
    ...getCompanionProgressForExperience(progress.experience),
    experienceInLevel: progress.experience_in_level,
    experienceToNextLevel: progress.experience_to_next_level,
    level: progress.level,
  };
}
