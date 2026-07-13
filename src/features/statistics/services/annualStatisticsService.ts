import type { SupabaseClient } from '@supabase/supabase-js';

import type { RoutineItemStatusEvent } from '@/features/streaks/domain/itemStreak';
import {
  createAnnualStatistics,
  getYearRoutineDayRange,
  type AnnualStatistics,
  type AnnualStatisticsRoutine,
} from '@/features/statistics/domain/annualStatistics';
import { getRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import type { Database } from '@/lib/supabase/database.types';

export async function loadAnnualStatistics(
  client: SupabaseClient<Database>,
  userId: string,
  year: string,
  routineDayConfig: RoutineDayConfig,
): Promise<AnnualStatistics> {
  const { endsOn, startsOn } = getYearRoutineDayRange(year);
  const [routinesResult, checkInsResult, statusEventsResult] = await Promise.all([
    client.from('routine_items').select('ends_on, id, schedule_weekdays, starts_on').eq('user_id', userId),
    client.from('check_ins').select('routine_day, routine_item_id').eq('user_id', userId).gte('routine_day', startsOn).lte('routine_day', endsOn),
    client.from('routine_item_status_events').select('effective_at, routine_item_id, status').eq('user_id', userId),
  ]);

  if (routinesResult.error || checkInsResult.error || statusEventsResult.error || !routinesResult.data || !checkInsResult.data || !statusEventsResult.data) {
    throw new Error('ANNUAL_STATISTICS_LOAD_FAILED');
  }

  const statusEventsByRoutineItemId = new Map<string, RoutineItemStatusEvent[]>();

  for (const event of statusEventsResult.data) {
    const events = statusEventsByRoutineItemId.get(event.routine_item_id) ?? [];

    events.push({ effectiveRoutineDay: getRoutineDayWindow(new Date(event.effective_at), routineDayConfig).key, status: event.status });
    statusEventsByRoutineItemId.set(event.routine_item_id, events);
  }

  const routines: AnnualStatisticsRoutine[] = routinesResult.data.map((routine) => ({
    endsOn: routine.ends_on,
    id: routine.id,
    scheduleWeekdays: routine.schedule_weekdays,
    startsOn: routine.starts_on,
    statusEvents: statusEventsByRoutineItemId.get(routine.id) ?? [],
  }));

  return createAnnualStatistics({
    checkIns: checkInsResult.data.map((checkIn) => ({ routineDay: checkIn.routine_day, routineItemId: checkIn.routine_item_id })),
    routines,
    year,
  });
}
