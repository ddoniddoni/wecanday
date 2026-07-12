import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import type { RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import type { Database, ProfileRow } from '@/lib/supabase/database.types';

export async function completeInitialRoutineDaySettings(
  client: SupabaseClient<Database>,
  config: RoutineDayConfig,
): Promise<ProfileRow> {
  const { data, error } = await client.rpc(
    'complete_initial_routine_day_settings',
    {
      p_day_start_minute: config.dayStartMinute,
      p_time_zone: config.timeZone,
    },
  );

  if (error || !data) {
    throw new AuthDomainError('AUTH_PROFILE_UNAVAILABLE');
  }

  return data;
}
