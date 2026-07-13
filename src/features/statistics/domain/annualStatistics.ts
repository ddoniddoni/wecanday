import { addDays, addYears, endOfYear, format, parseISO, startOfYear } from 'date-fns';

import { isRoutineItemScheduledOnDay, type RoutineItemStatusEvent } from '@/features/streaks/domain/itemStreak';

const YEAR_KEY_PATTERN = /^\d{4}$/;

export type AnnualStatisticsRoutine = {
  endsOn?: string | null;
  id: string;
  scheduleWeekdays: readonly number[];
  startsOn: string;
  statusEvents?: readonly RoutineItemStatusEvent[];
};

export type AnnualStatisticsCheckIn = { routineDay: string; routineItemId: string };

export type AnnualStatisticDay = {
  completedCount: number;
  completionRate: number | null;
  routineDay: string;
  scheduledCount: number;
};

export type AnnualMonthlyTrend = {
  completedCount: number;
  completionRate: number | null;
  monthKey: string;
  scheduledCount: number;
};

export type AnnualStatistics = {
  completedCount: number;
  days: readonly AnnualStatisticDay[];
  highestDailyStreak: number;
  monthlyTrends: readonly AnnualMonthlyTrend[];
  scheduledCount: number;
  totalCheckInCount: number;
  year: string;
};

export function createAnnualStatistics({
  checkIns,
  routines,
  year,
}: {
  checkIns: readonly AnnualStatisticsCheckIn[];
  routines: readonly AnnualStatisticsRoutine[];
  year: string;
}): AnnualStatistics {
  const { endsOn, startsOn } = getYearRoutineDayRange(year);
  const completedByRoutineDay = new Map<string, Set<string>>();

  for (const checkIn of checkIns) {
    const ids = completedByRoutineDay.get(checkIn.routineDay) ?? new Set<string>();

    ids.add(checkIn.routineItemId);
    completedByRoutineDay.set(checkIn.routineDay, ids);
  }

  const days: AnnualStatisticDay[] = [];
  let cursor = parseISO(startsOn);
  const end = parseISO(endsOn);

  while (cursor <= end) {
    const routineDay = format(cursor, 'yyyy-MM-dd');
    const scheduledRoutineItemIds = routines
      .filter((routine) => isRoutineItemScheduledOnDay(routine, routineDay))
      .map((routine) => routine.id);
    const completedRoutineItemIds = completedByRoutineDay.get(routineDay) ?? new Set<string>();
    const completedCount = scheduledRoutineItemIds.filter((id) => completedRoutineItemIds.has(id)).length;
    const scheduledCount = scheduledRoutineItemIds.length;

    days.push({
      completedCount,
      completionRate: scheduledCount === 0 ? null : Math.round((completedCount / scheduledCount) * 100),
      routineDay,
      scheduledCount,
    });
    cursor = addDays(cursor, 1);
  }

  const scheduledCount = days.reduce((sum, day) => sum + day.scheduledCount, 0);
  const completedCount = days.reduce((sum, day) => sum + day.completedCount, 0);

  return {
    completedCount,
    days,
    highestDailyStreak: calculateHighestDailyStreak(days),
    monthlyTrends: createMonthlyTrends(days, year),
    scheduledCount,
    totalCheckInCount: new Set(checkIns.map((checkIn) => `${checkIn.routineDay}:${checkIn.routineItemId}`)).size,
    year,
  };
}

export function getAdjacentYear(year: string, amount: number): string {
  assertYear(year);

  if (!Number.isInteger(amount)) {
    throw new RangeError('Year adjustment must be an integer.');
  }

  return format(addYears(parseISO(`${year}-01-01`), amount), 'yyyy');
}

export function getYearRoutineDayRange(year: string): { endsOn: string; startsOn: string } {
  assertYear(year);
  const date = parseISO(`${year}-01-01`);

  return {
    endsOn: format(endOfYear(date), 'yyyy-MM-dd'),
    startsOn: format(startOfYear(date), 'yyyy-MM-dd'),
  };
}

function createMonthlyTrends(
  days: readonly AnnualStatisticDay[],
  year: string,
): AnnualMonthlyTrend[] {
  return Array.from({ length: 12 }, (_, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
    const monthDays = days.filter((day) => day.routineDay.startsWith(monthKey));
    const scheduledCount = monthDays.reduce((sum, day) => sum + day.scheduledCount, 0);
    const completedCount = monthDays.reduce((sum, day) => sum + day.completedCount, 0);

    return {
      completedCount,
      completionRate: scheduledCount === 0 ? null : Math.round((completedCount / scheduledCount) * 100),
      monthKey,
      scheduledCount,
    };
  });
}

function calculateHighestDailyStreak(days: readonly AnnualStatisticDay[]): number {
  let highest = 0;
  let streak = 0;

  for (const day of days) {
    if (day.scheduledCount === 0) {
      continue;
    }

    if (day.completedCount === day.scheduledCount) {
      streak += 1;
      highest = Math.max(highest, streak);
    } else {
      streak = 0;
    }
  }

  return highest;
}

function assertYear(year: string): void {
  if (!YEAR_KEY_PATTERN.test(year) || Number.isNaN(parseISO(`${year}-01-01`).getTime())) {
    throw new RangeError('Year must use the YYYY format.');
  }
}
