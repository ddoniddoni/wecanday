import { addDays, addMonths, endOfMonth, format, getDay, parseISO, startOfMonth } from 'date-fns';

import { isRoutineItemScheduledOnDay, type RoutineItemStatusEvent } from '@/features/streaks/domain/itemStreak';

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export type MonthlyStatisticsRoutine = {
  endsOn?: string | null;
  id: string;
  planId: string;
  planTitle: string;
  scheduleWeekdays: readonly number[];
  startsOn: string;
  statusEvents?: readonly RoutineItemStatusEvent[];
};

export type MonthlyStatisticsCheckIn = {
  routineDay: string;
  routineItemId: string;
};

export type MonthlyStatisticDay = {
  completedCount: number;
  completionRate: number | null;
  routineDay: string;
  scheduledCount: number;
};

export type MonthlyPlanStatistic = {
  completedCount: number;
  completionRate: number;
  planId: string;
  planTitle: string;
  scheduledCount: number;
};

export type MonthlyStatistics = {
  completedCount: number;
  completedRoutineDayCount: number;
  days: readonly MonthlyStatisticDay[];
  monthKey: string;
  planStatistics: readonly MonthlyPlanStatistic[];
  previousCompletionRate: number | null;
  scheduledCount: number;
  startsOnWeekday: number;
};

export function createMonthlyStatistics({
  checkIns,
  monthKey,
  previousMonthCheckIns,
  routines,
}: {
  checkIns: readonly MonthlyStatisticsCheckIn[];
  monthKey: string;
  previousMonthCheckIns: readonly MonthlyStatisticsCheckIn[];
  routines: readonly MonthlyStatisticsRoutine[];
}): MonthlyStatistics {
  const days = createMonthlyStatisticDays(monthKey, routines, checkIns);
  const previousMonthKey = getAdjacentMonthKey(monthKey, -1);
  const previousDays = createMonthlyStatisticDays(
    previousMonthKey,
    routines,
    previousMonthCheckIns,
  );
  const completedCount = sumCompletedCount(days);
  const scheduledCount = sumScheduledCount(days);
  const previousScheduledCount = sumScheduledCount(previousDays);

  return {
    completedCount,
    completedRoutineDayCount: days.filter(
      (day) => day.scheduledCount > 0 && day.completedCount === day.scheduledCount,
    ).length,
    days,
    monthKey,
    planStatistics: createPlanStatistics(routines, days, checkIns),
    previousCompletionRate: previousScheduledCount === 0
      ? null
      : Math.round((sumCompletedCount(previousDays) / previousScheduledCount) * 100),
    scheduledCount,
    startsOnWeekday: getDay(parseISO(`${monthKey}-01`)),
  };
}

export function getAdjacentMonthKey(monthKey: string, amount: number): string {
  assertMonthKey(monthKey);

  if (!Number.isInteger(amount)) {
    throw new RangeError('Month adjustment must be an integer.');
  }

  return format(addMonths(parseISO(`${monthKey}-01`), amount), 'yyyy-MM');
}

export function getMonthRoutineDayRange(monthKey: string): {
  endsOn: string;
  startsOn: string;
} {
  assertMonthKey(monthKey);
  const month = parseISO(`${monthKey}-01`);

  return {
    endsOn: format(endOfMonth(month), 'yyyy-MM-dd'),
    startsOn: format(startOfMonth(month), 'yyyy-MM-dd'),
  };
}

function createMonthlyStatisticDays(
  monthKey: string,
  routines: readonly MonthlyStatisticsRoutine[],
  checkIns: readonly MonthlyStatisticsCheckIn[],
): MonthlyStatisticDay[] {
  const { endsOn, startsOn } = getMonthRoutineDayRange(monthKey);
  const completedByRoutineDay = new Map<string, Set<string>>();

  for (const checkIn of checkIns) {
    const completedRoutineItemIds = completedByRoutineDay.get(checkIn.routineDay) ?? new Set<string>();

    completedRoutineItemIds.add(checkIn.routineItemId);
    completedByRoutineDay.set(checkIn.routineDay, completedRoutineItemIds);
  }

  const days: MonthlyStatisticDay[] = [];
  let cursor = parseISO(startsOn);
  const end = parseISO(endsOn);

  while (cursor <= end) {
    const routineDay = format(cursor, 'yyyy-MM-dd');
    const scheduledRoutineItemIds = routines
      .filter((routine) => isRoutineItemScheduledOnDay(routine, routineDay))
      .map((routine) => routine.id);
    const completedRoutineItemIds = completedByRoutineDay.get(routineDay) ?? new Set<string>();
    const completedCount = scheduledRoutineItemIds.filter((routineItemId) =>
      completedRoutineItemIds.has(routineItemId),
    ).length;
    const scheduledCount = scheduledRoutineItemIds.length;

    days.push({
      completedCount,
      completionRate: scheduledCount === 0
        ? null
        : Math.round((completedCount / scheduledCount) * 100),
      routineDay,
      scheduledCount,
    });
    cursor = addDays(cursor, 1);
  }

  return days;
}

function createPlanStatistics(
  routines: readonly MonthlyStatisticsRoutine[],
  days: readonly MonthlyStatisticDay[],
  checkIns: readonly MonthlyStatisticsCheckIn[],
): MonthlyPlanStatistic[] {
  const completedRoutineItemIdsByDay = new Map<string, Set<string>>();

  for (const checkIn of checkIns) {
    const completedRoutineItemIds = completedRoutineItemIdsByDay.get(checkIn.routineDay) ?? new Set<string>();

    completedRoutineItemIds.add(checkIn.routineItemId);
    completedRoutineItemIdsByDay.set(checkIn.routineDay, completedRoutineItemIds);
  }

  const statisticsByPlanId = new Map<string, Omit<MonthlyPlanStatistic, 'completionRate'>>();

  for (const day of days) {
    const completedRoutineItemIds = completedRoutineItemIdsByDay.get(day.routineDay) ?? new Set<string>();

    for (const routine of routines) {
      if (!isRoutineItemScheduledOnDay(routine, day.routineDay)) {
        continue;
      }

      const previous = statisticsByPlanId.get(routine.planId) ?? {
        completedCount: 0,
        planId: routine.planId,
        planTitle: routine.planTitle,
        scheduledCount: 0,
      };

      statisticsByPlanId.set(routine.planId, {
        ...previous,
        completedCount: previous.completedCount + (completedRoutineItemIds.has(routine.id) ? 1 : 0),
        scheduledCount: previous.scheduledCount + 1,
      });
    }
  }

  return [...statisticsByPlanId.values()]
    .map((statistic) => ({
      ...statistic,
      completionRate: Math.round((statistic.completedCount / statistic.scheduledCount) * 100),
    }))
    .sort((left, right) =>
      right.completionRate - left.completionRate || left.planTitle.localeCompare(right.planTitle),
    );
}

function sumCompletedCount(days: readonly MonthlyStatisticDay[]): number {
  return days.reduce((sum, day) => sum + day.completedCount, 0);
}

function sumScheduledCount(days: readonly MonthlyStatisticDay[]): number {
  return days.reduce((sum, day) => sum + day.scheduledCount, 0);
}

function assertMonthKey(monthKey: string): void {
  if (!MONTH_KEY_PATTERN.test(monthKey)) {
    throw new RangeError('Month must use the YYYY-MM format.');
  }

  const parsed = parseISO(`${monthKey}-01`);

  if (Number.isNaN(parsed.getTime()) || format(parsed, 'yyyy-MM') !== monthKey) {
    throw new RangeError('Month must be valid.');
  }
}
