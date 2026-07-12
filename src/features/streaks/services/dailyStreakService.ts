import type { SupabaseClient } from '@supabase/supabase-js';

import {
  calculateCurrentDailyStreak,
  createDailyStreakDays,
} from '@/features/streaks/domain/dailyStreak';
import { getRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import type { Database } from '@/lib/supabase/database.types';

export async function loadCurrentDailyStreak(
  client: SupabaseClient<Database>,
  userId: string,
  routineDay: string,
  routineDayConfig: RoutineDayConfig,
): Promise<number> {
  const [routinesResult, checkInsResult, statusEventsResult] = await Promise.all([
    client
      .from('routine_items')
      .select('ends_on, id, schedule_weekdays, starts_on')
      .eq('user_id', userId),
    client
      .from('check_ins')
      .select('routine_day, routine_item_id')
      .eq('user_id', userId)
      .lte('routine_day', routineDay),
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
    throw new Error('DAILY_STREAK_LOAD_FAILED');
  }

  if (routinesResult.data.length === 0) {
    return 0;
  }

  const statusEventsByRoutineItemId = new Map<string, {
    effectiveRoutineDay: string;
    status: 'active' | 'archived' | 'completed' | 'paused';
  }[]>();

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

  const days = createDailyStreakDays({
    checkIns: checkInsResult.data.map((checkIn) => ({
      routineDay: checkIn.routine_day,
      routineItemId: checkIn.routine_item_id,
    })),
    routines: routinesResult.data.map((routine) => ({
      endsOn: routine.ends_on,
      id: routine.id,
      scheduleWeekdays: routine.schedule_weekdays,
      startsOn: routine.starts_on,
      statusEvents: statusEventsByRoutineItemId.get(routine.id) ?? [],
    })),
    throughRoutineDay: routineDay,
  });

  const earliestStartsOn = routinesResult.data.reduce(
    (earliest, routine) =>
      routine.starts_on < earliest ? routine.starts_on : earliest,
    routinesResult.data[0].starts_on,
  );

  return calculateCurrentDailyStreak({
    days,
    startsOn: earliestStartsOn,
    throughRoutineDay: routineDay,
  });
}
