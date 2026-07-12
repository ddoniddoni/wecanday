import { format, getDay, isAfter, isBefore, parseISO, subDays } from 'date-fns';

const ROUTINE_DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type RoutineItemStatus = 'active' | 'archived' | 'completed' | 'paused';

export type RoutineItemStatusEvent = {
  effectiveRoutineDay: string;
  status: RoutineItemStatus;
};

export type RoutineItemStreakInput = {
  completedRoutineDays: readonly string[];
  endsOn?: string | null;
  scheduleWeekdays: readonly number[];
  startsOn: string;
  statusEvents?: readonly RoutineItemStatusEvent[];
  throughRoutineDay: string;
};

export function calculateRoutineItemStreak(
  input: RoutineItemStreakInput,
): number {
  const startsOn = parseRoutineDayKey(input.startsOn);
  const throughRoutineDay = parseRoutineDayKey(input.throughRoutineDay);
  const completedRoutineDays = new Set(input.completedRoutineDays);
  let streak = 0;
  let cursor = throughRoutineDay;

  while (!isBefore(cursor, startsOn)) {
    const routineDay = format(cursor, 'yyyy-MM-dd');

    if (isRoutineItemScheduledOnDay(input, routineDay)) {
      if (!completedRoutineDays.has(routineDay)) {
        return streak;
      }

      streak += 1;
    }

    cursor = subDays(cursor, 1);
  }

  return streak;
}

export function isRoutineItemScheduledOnDay(
  input: Pick<
    RoutineItemStreakInput,
    'endsOn' | 'scheduleWeekdays' | 'startsOn' | 'statusEvents'
  >,
  routineDay: string,
): boolean {
  const day = parseRoutineDayKey(routineDay);
  const startsOn = parseRoutineDayKey(input.startsOn);
  const endsOn = input.endsOn ? parseRoutineDayKey(input.endsOn) : null;

  if (
    input.scheduleWeekdays.length === 0 ||
    isBefore(day, startsOn) ||
    (endsOn !== null && isAfter(day, endsOn))
  ) {
    return false;
  }

  assertScheduleWeekdays(input.scheduleWeekdays);

  return (
    getRoutineItemStatusOnDay(input.statusEvents ?? [], routineDay) === 'active' &&
    input.scheduleWeekdays.includes(getDay(day))
  );
}

export function getRoutineItemStatusOnDay(
  statusEvents: readonly RoutineItemStatusEvent[],
  routineDay: string,
): RoutineItemStatus {
  parseRoutineDayKey(routineDay);
  let status: RoutineItemStatus = 'active';

  for (const event of [...statusEvents].sort((left, right) =>
    left.effectiveRoutineDay.localeCompare(right.effectiveRoutineDay),
  )) {
    parseRoutineDayKey(event.effectiveRoutineDay);

    if (event.effectiveRoutineDay > routineDay) {
      break;
    }

    status = event.status;
  }

  return status;
}

function assertScheduleWeekdays(scheduleWeekdays: readonly number[]): void {
  if (
    scheduleWeekdays.some(
      (weekday) => !Number.isInteger(weekday) || weekday < 0 || weekday > 6,
    )
  ) {
    throw new RangeError('Routine schedule weekdays must be between 0 and 6.');
  }
}

function parseRoutineDayKey(routineDay: string): Date {
  if (!ROUTINE_DAY_KEY_PATTERN.test(routineDay)) {
    throw new RangeError('Routine day must use the YYYY-MM-DD format.');
  }

  const parsed = parseISO(routineDay);

  if (Number.isNaN(parsed.getTime()) || format(parsed, 'yyyy-MM-dd') !== routineDay) {
    throw new RangeError('Routine day must be a valid calendar date.');
  }

  return parsed;
}
