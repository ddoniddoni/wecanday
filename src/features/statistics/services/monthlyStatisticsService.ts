import type { SupabaseClient } from '@supabase/supabase-js';

import type { RoutineItemStatusEvent } from '@/features/streaks/domain/itemStreak';
import {
  createMonthlyStatistics,
  getAdjacentMonthKey,
  getMonthRoutineDayRange,
  type MonthlyStatistics,
  type MonthlyStatisticsRoutine,
} from '@/features/statistics/domain/monthlyStatistics';
import { getRoutineDayWindow, type RoutineDayConfig } from '@/features/routine-day/domain/routineDay';
import type { Database } from '@/lib/supabase/database.types';

export async function loadMonthlyStatistics(
  client: SupabaseClient<Database>,
  userId: string,
  monthKey: string,
  routineDayConfig: RoutineDayConfig,
): Promise<MonthlyStatistics> {
  const previousMonthKey = getAdjacentMonthKey(monthKey, -1);
  const { endsOn } = getMonthRoutineDayRange(monthKey);
  const { startsOn: previousMonthStartsOn } = getMonthRoutineDayRange(previousMonthKey);
  const [routinesResult, plansResult, checkInsResult, statusEventsResult] = await Promise.all([
    client
      .from('routine_items')
      .select('ends_on, id, plan_id, schedule_weekdays, starts_on')
      .eq('user_id', userId),
    client
      .from('plans')
      .select('id, title')
      .eq('user_id', userId),
    client
      .from('check_ins')
      .select('routine_day, routine_item_id')
      .eq('user_id', userId)
      .gte('routine_day', previousMonthStartsOn)
      .lte('routine_day', endsOn),
    client
      .from('routine_item_status_events')
      .select('effective_at, routine_item_id, status')
      .eq('user_id', userId),
  ]);

  if (
    routinesResult.error ||
    plansResult.error ||
    checkInsResult.error ||
    statusEventsResult.error ||
    !routinesResult.data ||
    !plansResult.data ||
    !checkInsResult.data ||
    !statusEventsResult.data
  ) {
    throw new Error('MONTHLY_STATISTICS_LOAD_FAILED');
  }

  const planTitleById = new Map(plansResult.data.map((plan) => [plan.id, plan.title]));
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

  const routines: MonthlyStatisticsRoutine[] = routinesResult.data.map((routine) => {
    const planTitle = planTitleById.get(routine.plan_id);

    if (!planTitle) {
      throw new Error('MONTHLY_STATISTICS_LOAD_FAILED');
    }

    return {
      endsOn: routine.ends_on,
      id: routine.id,
      planId: routine.plan_id,
      planTitle,
      scheduleWeekdays: routine.schedule_weekdays,
      startsOn: routine.starts_on,
      statusEvents: statusEventsByRoutineItemId.get(routine.id) ?? [],
    };
  });
  const currentRange = getMonthRoutineDayRange(monthKey);
  const previousRange = getMonthRoutineDayRange(previousMonthKey);

  return createMonthlyStatistics({
    checkIns: checkInsResult.data
      .filter((checkIn) =>
        checkIn.routine_day >= currentRange.startsOn && checkIn.routine_day <= currentRange.endsOn,
      )
      .map((checkIn) => ({
        routineDay: checkIn.routine_day,
        routineItemId: checkIn.routine_item_id,
      })),
    monthKey,
    previousMonthCheckIns: checkInsResult.data
      .filter((checkIn) =>
        checkIn.routine_day >= previousRange.startsOn && checkIn.routine_day <= previousRange.endsOn,
      )
      .map((checkIn) => ({
        routineDay: checkIn.routine_day,
        routineItemId: checkIn.routine_item_id,
      })),
    routines,
  });
}
