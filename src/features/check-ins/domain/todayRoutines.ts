import { getDay, parseISO } from 'date-fns';

import type { RoutineItemRow } from '@/lib/supabase/database.types';

export type CheckInSyncStatus = 'queued' | 'synced' | 'syncing';

export type TodayRoutineItem = Pick<RoutineItemRow, 'id' | 'title'> & {
  completedAt: string | null;
  syncStatus: CheckInSyncStatus | null;
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
  routines: Pick<RoutineItemRow, 'id' | 'schedule_weekdays' | 'title'>[],
  routineDay: string,
  completedByRoutineId: ReadonlyMap<string, string>,
): TodayRoutineItem[] {
  return routines
    .filter((routine) => isRoutineScheduledForDay(routine, routineDay))
    .sort((left, right) => left.title.localeCompare(right.title))
    .map((routine) => ({
      completedAt: completedByRoutineId.get(routine.id) ?? null,
      id: routine.id,
      syncStatus: null,
      title: routine.title,
    }));
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
