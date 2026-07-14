import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CheckInDomainError,
  type CheckInErrorCode,
} from '@/features/check-ins/domain/checkInErrors';
import {
  createTodayRoutineItems,
  type TodayRoutineItem,
} from '@/features/check-ins/domain/todayRoutines';
import type { Database } from '@/lib/supabase/database.types';

export type CheckInMutation = {
  idempotencyKey: string;
  occurredAt: string;
  routineDay: string;
  routineItemId: string;
  source: 'offline_sync' | 'online';
};

export async function loadTodayRoutineItems(
  client: SupabaseClient<Database>,
  userId: string,
  routineDay: string,
): Promise<TodayRoutineItem[]> {
  const [{ data: routines, error: routinesError }, { data: checkIns, error: checkInsError }] =
    await Promise.all([
      client
        .from('routine_items')
        .select('id, reminder_minute, schedule_weekdays, sort_order, title')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lte('starts_on', routineDay)
        .or(`ends_on.is.null,ends_on.gte.${routineDay}`),
      client
        .from('check_ins')
        .select('routine_item_id, completed_at')
        .eq('user_id', userId)
        .eq('routine_day', routineDay),
    ]);

  if (routinesError || checkInsError || !routines || !checkIns) {
    throw new CheckInDomainError('CHECK_IN_FAILED');
  }

  const completedByRoutineId = new Map(
    checkIns.map((checkIn) => [checkIn.routine_item_id, checkIn.completed_at]),
  );

  return createTodayRoutineItems(routines, routineDay, completedByRoutineId);
}

export async function completeCheckIn(
  client: SupabaseClient<Database>,
  mutation: CheckInMutation,
): Promise<void> {
  const { error } = await client.rpc('complete_check_in', {
    p_completed_at: mutation.occurredAt,
    p_idempotency_key: mutation.idempotencyKey,
    p_routine_day: mutation.routineDay,
    p_routine_item_id: mutation.routineItemId,
    p_source: mutation.source,
  });

  if (error) {
    throw new CheckInDomainError(toCheckInErrorCode(error.message));
  }
}

export async function undoCheckIn(
  client: SupabaseClient<Database>,
  mutation: CheckInMutation,
): Promise<void> {
  const { error } = await client.rpc('undo_check_in', {
    p_idempotency_key: mutation.idempotencyKey,
    p_occurred_at: mutation.occurredAt,
    p_routine_day: mutation.routineDay,
    p_routine_item_id: mutation.routineItemId,
    p_source: mutation.source,
  });

  if (error) {
    throw new CheckInDomainError(toCheckInErrorCode(error.message));
  }
}

function toCheckInErrorCode(message: string): CheckInErrorCode {
  if (message.includes('CHECK_IN_WINDOW_CLOSED')) {
    return 'CHECK_IN_WINDOW_CLOSED';
  }

  if (message.includes('INVALID_ROUTINE_DAY')) {
    return 'INVALID_ROUTINE_DAY';
  }

  if (message.includes('ROUTINE_NOT_SCHEDULED')) {
    return 'ROUTINE_NOT_SCHEDULED';
  }

  if (message.includes('ROUTINE_DAY_SETTINGS_REQUIRED')) {
    return 'ROUTINE_DAY_SETTINGS_REQUIRED';
  }

  return 'CHECK_IN_FAILED';
}
