export type RoutineFormIssue =
  | 'reminderTime'
  | 'routineTitle'
  | 'scheduleWeekdays';

type RoutineFormValues = {
  reminderTime: string;
  routineTitle: string;
  scheduleWeekdays: number[];
};

export function getRoutineFormIssues({
  reminderTime,
  routineTitle,
  scheduleWeekdays,
}: RoutineFormValues): RoutineFormIssue[] {
  const issues: RoutineFormIssue[] = [];

  if (routineTitle.trim().length === 0) {
    issues.push('routineTitle');
  }

  if (scheduleWeekdays.length === 0) {
    issues.push('scheduleWeekdays');
  }

  if (parseReminderMinute(reminderTime) === undefined) {
    issues.push('reminderTime');
  }

  return issues;
}

export function formatReminderTime(reminderMinute: number | null): string {
  if (reminderMinute === null) {
    return '';
  }

  return `${Math.floor(reminderMinute / 60).toString().padStart(2, '0')}:${(reminderMinute % 60).toString().padStart(2, '0')}`;
}

export function parseReminderMinute(value: string): number | null | undefined {
  if (value.trim() === '') {
    return null;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  return hour <= 23 && minute <= 59 ? hour * 60 + minute : undefined;
}
