import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createDailyStreakDays,
  type DailyStreakRoutine,
} from '@/features/streaks/domain/dailyStreak';
import type { RoutineItemStatusEvent } from '@/features/streaks/domain/itemStreak';
import { getRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import { createWeeklyStatistics, type WeeklyStatistics } from '@/features/statistics/domain/weeklyStatistics';
import type { Database } from '@/lib/supabase/database.types';

export async function loadWeeklyStatistics(
  client: SupabaseClient<Database>,
  userId: string,
  throughRoutineDay: string,
  routineDayConfig: RoutineDayConfig,
): Promise<WeeklyStatistics> {
  const [routinesResult, checkInsResult, statusEventsResult] = await Promise.all([
    client
      .from('routine_items')
      .select('ends_on, id, schedule_weekdays, starts_on')
      .eq('user_id', userId),
    client
      .from('check_ins')
      .select('routine_day, routine_item_id')
      .eq('user_id', userId)
      .lte('routine_day', throughRoutineDay),
    client
      .from('routine_item_status_events')
      .select('effective_at, routine_item_id, status')
      .eq('user_id', userId),
  ]);

  if (
    routinesResult.error ||
    checkInsResult.error ||
    statusEventsResult.error ||
    !routinesResult.data ||
    !checkInsResult.data ||
    !statusEventsResult.data
  ) {
    throw new Error('WEEKLY_STATISTICS_LOAD_FAILED');
  }

  if (routinesResult.data.length === 0) {
    return createWeeklyStatistics({
      days: [],
      startsOn: throughRoutineDay,
      throughRoutineDay,
    });
  }

  const statusEventsByRoutineItemId = new Map<string, RoutineItemStatusEvent[]>();

  for (const event of statusEventsResult.data) {
    const statusEvents = statusEventsByRoutineItemId.get(event.routine_item_id) ?? [];

    statusEvents.push({
      effectiveRoutineDay: getRoutineDayWindow(
        new Date(event.effective_at),
        routineDayConfig,
      ).key,
      status: event.status,
    });
    statusEventsByRoutineItemId.set(event.routine_item_id, statusEvents);
  }

  const routines: DailyStreakRoutine[] = routinesResult.data.map((routine) => ({
    endsOn: routine.ends_on,
    id: routine.id,
    scheduleWeekdays: routine.schedule_weekdays,
    startsOn: routine.starts_on,
    statusEvents: statusEventsByRoutineItemId.get(routine.id) ?? [],
  }));
  const startsOn = routines.reduce(
    (earliest, routine) => routine.startsOn < earliest ? routine.startsOn : earliest,
    routines[0].startsOn,
  );

  return createWeeklyStatistics({
    days: createDailyStreakDays({
      checkIns: checkInsResult.data.map((checkIn) => ({
        routineDay: checkIn.routine_day,
        routineItemId: checkIn.routine_item_id,
      })),
      routines,
      throughRoutineDay,
    }),
    startsOn,
    throughRoutineDay,
  });
}
