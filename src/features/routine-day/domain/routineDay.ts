import { addDays } from 'date-fns';
import { TZDateMini } from '@date-fns/tz';

const MINUTES_PER_DAY = 24 * 60;
const ROUTINE_DAY_START_TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

export type RoutineDayConfig = {
  dayStartMinute: number;
  timeZone: string;
};

export type RoutineDayWindow = {
  endsAt: string;
  key: string;
  startsAt: string;
};

export type RoutineDayTiming = RoutineDayWindow & {
  remainingHours: number;
  remainingMinutes: number;
  remainingTotalMinutes: number;
};

export type Clock = {
  now: () => Date;
};

export const systemClock: Clock = {
  now: () => new Date(),
};

export function validateRoutineDayConfig(
  config: RoutineDayConfig,
): RoutineDayConfig {
  assertValidConfig(config);
  return config;
}

export function parseRoutineDayStartTime(value: string): number | null {
  const match = ROUTINE_DAY_START_TIME_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

export function formatRoutineDayStartTime(dayStartMinute: number): string {
  assertValidConfig({ dayStartMinute, timeZone: 'UTC' });

  const hour = Math.floor(dayStartMinute / 60);
  const minute = dayStartMinute % 60;

  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
}

export function adjustRoutineDayStartTime(
  dayStartMinute: number,
  adjustment: number,
): number {
  assertValidConfig({ dayStartMinute, timeZone: 'UTC' });

  return (dayStartMinute + adjustment + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function getRoutineDayWindow(
  instant: Date,
  config: RoutineDayConfig,
): RoutineDayWindow {
  assertValidInstant(instant);
  validateRoutineDayConfig(config);

  const localInstant = new TZDateMini(instant.getTime(), config.timeZone);
  const currentMinute =
    localInstant.getHours() * 60 + localInstant.getMinutes();
  const dayStartHour = Math.floor(config.dayStartMinute / 60);
  const dayStartMinute = config.dayStartMinute % 60;
  const localCalendarDay = new TZDateMini(
    localInstant.getFullYear(),
    localInstant.getMonth(),
    localInstant.getDate(),
    12,
    0,
    config.timeZone,
  );
  const routineCalendarDay =
    currentMinute < config.dayStartMinute
      ? addDays(localCalendarDay, -1)
      : localCalendarDay;
  const start = createLocalBoundary(
    routineCalendarDay,
    dayStartHour,
    dayStartMinute,
    config.timeZone,
  );
  const endCalendarDay = addDays(routineCalendarDay, 1);
  const end = createLocalBoundary(
    endCalendarDay,
    dayStartHour,
    dayStartMinute,
    config.timeZone,
  );

  return {
    endsAt: toUtcIsoString(end),
    key: toRoutineDayKey(routineCalendarDay),
    startsAt: toUtcIsoString(start),
  };
}

export function getCurrentRoutineDayWindow(
  config: RoutineDayConfig,
  clock: Clock = systemClock,
): RoutineDayWindow {
  return getRoutineDayWindow(clock.now(), config);
}

export function getNextRoutineDayStart(
  instant: Date,
  config: RoutineDayConfig,
): string {
  return getRoutineDayWindow(instant, config).endsAt;
}

export function getRoutineDayTiming(
  instant: Date,
  config: RoutineDayConfig,
): RoutineDayTiming {
  const window = getRoutineDayWindow(instant, config);
  const remainingMilliseconds = Date.parse(window.endsAt) - instant.getTime();
  const remainingTotalMinutes = Math.max(
    0,
    Math.ceil(remainingMilliseconds / 60_000),
  );

  return {
    ...window,
    remainingHours: Math.floor(remainingTotalMinutes / 60),
    remainingMinutes: remainingTotalMinutes % 60,
    remainingTotalMinutes,
  };
}

export function getMillisecondsUntilNextMinute(instant: Date): number {
  assertValidInstant(instant);

  return 60_000 - (instant.getSeconds() * 1_000 + instant.getMilliseconds());
}

export function formatRoutineDayEndTime(
  endsAt: string,
  locale: string,
  timeZone: string,
): string {
  const end = new Date(endsAt);

  assertValidInstant(end);

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(end);
}

function assertValidInstant(instant: Date): void {
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError('Routine day instant must be a valid Date.');
  }
}

function assertValidConfig(config: RoutineDayConfig): void {
  if (
    !Number.isInteger(config.dayStartMinute) ||
    config.dayStartMinute < 0 ||
    config.dayStartMinute >= MINUTES_PER_DAY
  ) {
    throw new RangeError('Routine day start must be between 0 and 1439.');
  }

  const timeZoneProbe = new TZDateMini(0, config.timeZone);

  if (Number.isNaN(timeZoneProbe.getTime())) {
    throw new RangeError('Routine day time zone must be a valid IANA time zone.');
  }
}

function createLocalBoundary(
  localCalendarDay: Date,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  return new TZDateMini(
    localCalendarDay.getFullYear(),
    localCalendarDay.getMonth(),
    localCalendarDay.getDate(),
    hour,
    minute,
    timeZone,
  );
}

function toRoutineDayKey(localCalendarDay: Date): string {
  return [
    localCalendarDay.getFullYear().toString().padStart(4, '0'),
    (localCalendarDay.getMonth() + 1).toString().padStart(2, '0'),
    localCalendarDay.getDate().toString().padStart(2, '0'),
  ].join('-');
}

function toUtcIsoString(date: Date): string {
  return new Date(date.getTime()).toISOString();
}
