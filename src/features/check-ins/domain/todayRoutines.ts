import { getDay, parseISO } from 'date-fns';

import type { RoutineItemRow } from '@/lib/supabase/database.types';

export type CheckInSyncStatus = 'queued' | 'synced' | 'syncing';

export type TodayRoutineItem = Pick<
  RoutineItemRow,
  'id' | 'reminder_minute' | 'schedule_weekdays' | 'sort_order' | 'title'
> & {
  completedAt: string | null;
  syncStatus: CheckInSyncStatus | null;
};

export const TIME_OF_DAY_GROUPS = ['morning', 'daytime', 'evening', 'anytime'] as const;

export type TimeOfDayGroup = (typeof TIME_OF_DAY_GROUPS)[number];

export type TodayRoutineGroup = {
  items: TodayRoutineItem[];
  key: TimeOfDayGroup;
};

export type PendingCheckInOperation = {
  createdAt: string;
  kind: 'complete' | 'undo';
  routineItemId: string;
};

export function isRoutineScheduledForDay(
  routine: Pick<RoutineItemRow, 'schedule_weekdays'>,
  routineDay: string,
): boolean {
  return routine.schedule_weekdays.includes(getDay(parseISO(routineDay)));
}

export function createTodayRoutineItems(
  routines: Pick<
    RoutineItemRow,
    'id' | 'reminder_minute' | 'schedule_weekdays' | 'sort_order' | 'title'
  >[],
  routineDay: string,
  completedByRoutineId: ReadonlyMap<string, string>,
): TodayRoutineItem[] {
  return routines
    .filter((routine) => isRoutineScheduledForDay(routine, routineDay))
    .sort((left, right) => left.title.localeCompare(right.title))
    .map((routine) => ({
      completedAt: completedByRoutineId.get(routine.id) ?? null,
      id: routine.id,
      reminder_minute: routine.reminder_minute,
      schedule_weekdays: routine.schedule_weekdays,
      sort_order: routine.sort_order,
      syncStatus: null,
      title: routine.title,
    }));
}

export function groupTodayRoutineItems(items: TodayRoutineItem[]): TodayRoutineGroup[] {
  const itemsByGroup = new Map<TimeOfDayGroup, TodayRoutineItem[]>(
    TIME_OF_DAY_GROUPS.map((key) => [key, []]),
  );

  for (const item of items) {
    itemsByGroup.get(getRoutineTimeOfDay(item.reminder_minute))?.push(item);
  }

  return TIME_OF_DAY_GROUPS.flatMap((key) => {
    const groupItems = itemsByGroup.get(key) ?? [];

    if (groupItems.length === 0) {
      return [];
    }

    return [{
      items: [...groupItems].sort(compareRoutineItems),
      key,
    }];
  });
}

export function getRoutineTimeOfDay(reminderMinute: number | null): TimeOfDayGroup {
  if (reminderMinute === null) {
    return 'anytime';
  }

  if (reminderMinute >= 5 * 60 && reminderMinute < 12 * 60) {
    return 'morning';
  }

  if (reminderMinute >= 12 * 60 && reminderMinute < 17 * 60) {
    return 'daytime';
  }

  return 'evening';
}

export function getRoutineDayRange(centerRoutineDay: string): string[] {
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => addDaysToRoutineDay(centerRoutineDay, offset));
}

export function applyPendingCheckInOperations(
  items: TodayRoutineItem[],
  operations: PendingCheckInOperation[],
): TodayRoutineItem[] {
  const latestOperationByRoutineId = new Map<string, PendingCheckInOperation>();

  for (const operation of operations) {
    const latest = latestOperationByRoutineId.get(operation.routineItemId);

    if (!latest || latest.createdAt < operation.createdAt) {
      latestOperationByRoutineId.set(operation.routineItemId, operation);
    }
  }

  return items.map((item) => {
    const operation = latestOperationByRoutineId.get(item.id);

    if (!operation) {
      return item;
    }

    return operation.kind === 'complete'
      ? { ...item, completedAt: operation.createdAt, syncStatus: 'queued' }
      : { ...item, completedAt: null, syncStatus: 'queued' };
  });
}

function compareRoutineItems(left: TodayRoutineItem, right: TodayRoutineItem): number {
  const leftTime = left.reminder_minute ?? Number.POSITIVE_INFINITY;
  const rightTime = right.reminder_minute ?? Number.POSITIVE_INFINITY;

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  if (left.sort_order !== right.sort_order) {
    return left.sort_order - right.sort_order;
  }

  return left.title.localeCompare(right.title);
}

function addDaysToRoutineDay(routineDay: string, offset: number): string {
  const [year, month, day] = routineDay.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));

  return date.toISOString().slice(0, 10);
}
