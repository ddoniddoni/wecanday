import { addDays, format, isAfter, isBefore, parseISO, subDays } from 'date-fns';

import {
  isRoutineItemScheduledOnDay,
  type RoutineItemStatusEvent,
} from '@/features/streaks/domain/itemStreak';

const ROUTINE_DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DailyStreakDay = {
  completedRoutineItemIds: readonly string[];
  routineDay: string;
  scheduledRoutineItemIds: readonly string[];
};

export type DailyStreakInput = {
  days: readonly DailyStreakDay[];
  startsOn: string;
  throughRoutineDay: string;
};

export type DailyStreakRoutine = {
  endsOn?: string | null;
  id: string;
  scheduleWeekdays: readonly number[];
  startsOn: string;
  statusEvents?: readonly RoutineItemStatusEvent[];
};

export type RoutineDayCheckIn = {
  routineDay: string;
  routineItemId: string;
};

export function calculateDailyStreak(input: DailyStreakInput): number {
  const startsOn = parseRoutineDayKey(input.startsOn);
  const throughRoutineDay = parseRoutineDayKey(input.throughRoutineDay);
  const daysByRoutineDay = new Map(
    input.days.map((day) => [day.routineDay, day]),
  );
  let streak = 0;
  let cursor = throughRoutineDay;

  while (!isBefore(cursor, startsOn)) {
    const routineDay = format(cursor, 'yyyy-MM-dd');
    const day = daysByRoutineDay.get(routineDay);

    if (day && day.scheduledRoutineItemIds.length > 0) {
      if (!isDailyStreakDayComplete(day)) {
        return streak;
      }

      streak += 1;
    }

    cursor = subDays(cursor, 1);
  }

  return streak;
}

export function calculateCurrentDailyStreak(input: DailyStreakInput): number {
  const throughRoutineDay = parseRoutineDayKey(input.throughRoutineDay);
  const currentDay = input.days.find(
    (day) => day.routineDay === input.throughRoutineDay,
  );
  const effectiveThroughRoutineDay = currentDay && isDailyStreakDayComplete(currentDay)
    ? input.throughRoutineDay
    : format(subDays(throughRoutineDay, 1), 'yyyy-MM-dd');

  if (isBefore(parseRoutineDayKey(effectiveThroughRoutineDay), parseRoutineDayKey(input.startsOn))) {
    return 0;
  }

  return calculateDailyStreak({
    ...input,
    throughRoutineDay: effectiveThroughRoutineDay,
  });
}

export function createDailyStreakDays({
  checkIns,
  routines,
  throughRoutineDay,
}: {
  checkIns: readonly RoutineDayCheckIn[];
  routines: readonly DailyStreakRoutine[];
  throughRoutineDay: string;
}): DailyStreakDay[] {
  if (routines.length === 0) {
    return [];
  }

  const earliestStartsOn = routines.reduce(
    (earliest, routine) =>
      routine.startsOn < earliest ? routine.startsOn : earliest,
    routines[0].startsOn,
  );
  const completedRoutineItemIdsByDay = new Map<string, string[]>();

  for (const checkIn of checkIns) {
    const completedRoutineItemIds = completedRoutineItemIdsByDay.get(checkIn.routineDay) ?? [];

    completedRoutineItemIds.push(checkIn.routineItemId);
    completedRoutineItemIdsByDay.set(checkIn.routineDay, completedRoutineItemIds);
  }

  const days: DailyStreakDay[] = [];
  let cursor = parseRoutineDayKey(earliestStartsOn);
  const through = parseRoutineDayKey(throughRoutineDay);

  while (!isAfter(cursor, through)) {
    const routineDay = format(cursor, 'yyyy-MM-dd');

    days.push({
      completedRoutineItemIds: completedRoutineItemIdsByDay.get(routineDay) ?? [],
      routineDay,
      scheduledRoutineItemIds: routines
        .filter((routine) => isRoutineItemScheduledOnDay(routine, routineDay))
        .map((routine) => routine.id),
    });

    cursor = addDays(cursor, 1);
  }

  return days;
}

export function isDailyStreakDayComplete(day: DailyStreakDay): boolean {
  assertRoutineDayKey(day.routineDay);

  if (day.scheduledRoutineItemIds.length === 0) {
    return false;
  }

  const completedRoutineItemIds = new Set(day.completedRoutineItemIds);

  return day.scheduledRoutineItemIds.every((routineItemId) =>
    completedRoutineItemIds.has(routineItemId),
  );
}

function parseRoutineDayKey(routineDay: string): Date {
  assertRoutineDayKey(routineDay);

  return parseISO(routineDay);
}

function assertRoutineDayKey(routineDay: string): void {
  if (!ROUTINE_DAY_KEY_PATTERN.test(routineDay)) {
    throw new RangeError('Routine day must use the YYYY-MM-DD format.');
  }

  const parsed = parseISO(routineDay);

  if (Number.isNaN(parsed.getTime()) || format(parsed, 'yyyy-MM-dd') !== routineDay) {
    throw new RangeError('Routine day must be a valid calendar date.');
  }
}
