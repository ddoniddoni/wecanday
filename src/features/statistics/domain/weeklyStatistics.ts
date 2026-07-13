import { addDays, format, parseISO, subDays } from 'date-fns';

import {
  calculateCurrentDailyStreak,
  isDailyStreakDayComplete,
  type DailyStreakDay,
} from '@/features/streaks/domain/dailyStreak';

const ROUTINE_DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type WeeklyStatisticDay = {
  completedCount: number;
  completionRate: number | null;
  routineDay: string;
  scheduledCount: number;
};

export type WeeklyStatistics = {
  completedCount: number;
  currentDailyStreak: number;
  days: readonly WeeklyStatisticDay[];
  highestDailyStreak: number;
  scheduledCount: number;
};

export function createWeeklyStatistics({
  days,
  startsOn,
  throughRoutineDay,
}: {
  days: readonly DailyStreakDay[];
  startsOn: string;
  throughRoutineDay: string;
}): WeeklyStatistics {
  assertRoutineDayKey(throughRoutineDay);
  assertRoutineDayKey(startsOn);

  const daysByRoutineDay = new Map(days.map((day) => [day.routineDay, day]));
  const recentDays = getRecentRoutineDayKeys(throughRoutineDay, 7).map((routineDay) => {
    const day = daysByRoutineDay.get(routineDay);
    const scheduledRoutineItemIds = day?.scheduledRoutineItemIds ?? [];
    const scheduledRoutineItemIdSet = new Set(scheduledRoutineItemIds);
    const completedScheduledCount = [...new Set(day?.completedRoutineItemIds ?? [])].filter(
      (routineItemId) => scheduledRoutineItemIdSet.has(routineItemId),
    ).length;
    const scheduledCount = scheduledRoutineItemIds.length;

    return {
      completedCount: completedScheduledCount,
      completionRate: scheduledCount === 0
        ? null
        : Math.round((completedScheduledCount / scheduledCount) * 100),
      routineDay,
      scheduledCount,
    };
  });

  const scheduledCount = recentDays.reduce((sum, day) => sum + day.scheduledCount, 0);
  const completedCount = recentDays.reduce((sum, day) => sum + day.completedCount, 0);

  return {
    completedCount,
    currentDailyStreak: calculateCurrentDailyStreak({
      days,
      startsOn,
      throughRoutineDay,
    }),
    days: recentDays,
    highestDailyStreak: calculateHighestDailyStreak(days),
    scheduledCount,
  };
}

export function getRecentRoutineDayKeys(
  throughRoutineDay: string,
  count: number,
): string[] {
  assertRoutineDayKey(throughRoutineDay);

  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('Routine day count must be a positive integer.');
  }

  const through = parseISO(throughRoutineDay);

  return Array.from({ length: count }, (_, index) =>
    format(addDays(subDays(through, count - 1), index), 'yyyy-MM-dd'),
  );
}

function calculateHighestDailyStreak(days: readonly DailyStreakDay[]): number {
  let highestStreak = 0;
  let streak = 0;

  for (const day of [...days].sort((left, right) =>
    left.routineDay.localeCompare(right.routineDay),
  )) {
    if (day.scheduledRoutineItemIds.length === 0) {
      continue;
    }

    if (isDailyStreakDayComplete(day)) {
      streak += 1;
      highestStreak = Math.max(highestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return highestStreak;
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
