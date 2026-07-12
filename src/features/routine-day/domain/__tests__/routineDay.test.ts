import {
  adjustRoutineDayStartTime,
  formatRoutineDayStartTime,
  formatRoutineDayEndTime,
  getCurrentRoutineDayWindow,
  getMillisecondsUntilNextMinute,
  getNextRoutineDayStart,
  getRoutineDayTiming,
  getRoutineDayWindow,
  parseRoutineDayStartTime,
  type RoutineDayConfig,
} from '@/features/routine-day/domain/routineDay';

const seoulAtFour: RoutineDayConfig = {
  dayStartMinute: 4 * 60,
  timeZone: 'Asia/Seoul',
};

describe('getRoutineDayWindow', () => {
  it('parses direct HH:MM day-start input and adjusts it by whole hours', () => {
    expect(parseRoutineDayStartTime('5:37')).toBe(337);
    expect(parseRoutineDayStartTime('24:00')).toBeNull();
    expect(formatRoutineDayStartTime(0)).toBe('00:00');
    expect(adjustRoutineDayStartTime(23 * 60 + 30, 60)).toBe(30);
  });

  it('uses the previous local date immediately before the configured day start', () => {
    expect(
      getRoutineDayWindow(new Date('2026-07-12T18:59:59.999Z'), seoulAtFour),
    ).toEqual({
      endsAt: '2026-07-12T19:00:00.000Z',
      key: '2026-07-12',
      startsAt: '2026-07-11T19:00:00.000Z',
    });
  });

  it('starts a new routine day exactly at the configured local minute', () => {
    expect(
      getRoutineDayWindow(new Date('2026-07-12T19:00:00.000Z'), seoulAtFour),
    ).toEqual({
      endsAt: '2026-07-13T19:00:00.000Z',
      key: '2026-07-13',
      startsAt: '2026-07-12T19:00:00.000Z',
    });
  });

  it('handles month, year, and leap-day boundaries by local calendar date', () => {
    expect(
      getRoutineDayWindow(new Date('2025-12-31T18:00:00.000Z'), seoulAtFour)
        .key,
    ).toBe('2025-12-31');
    expect(
      getRoutineDayWindow(
        new Date('2024-02-29T18:00:00.000Z'),
        seoulAtFour,
      ).key,
    ).toBe('2024-02-29');
  });

  it('does not mistake a UTC date for the user routine date', () => {
    expect(
      getRoutineDayWindow(new Date('2026-07-12T01:00:00.000Z'), {
        dayStartMinute: 0,
        timeZone: 'America/New_York',
      }).key,
    ).toBe('2026-07-11');
  });

  it('preserves a local 04:00 boundary across the New York DST spring transition', () => {
    expect(
      getRoutineDayWindow(new Date('2026-03-08T07:59:59.999Z'), {
        dayStartMinute: 4 * 60,
        timeZone: 'America/New_York',
      }),
    ).toEqual({
      endsAt: '2026-03-08T08:00:00.000Z',
      key: '2026-03-07',
      startsAt: '2026-03-07T09:00:00.000Z',
    });
  });

  it('preserves a local 04:00 boundary across the New York DST fall transition', () => {
    expect(
      getRoutineDayWindow(new Date('2026-11-01T08:59:59.999Z'), {
        dayStartMinute: 4 * 60,
        timeZone: 'America/New_York',
      }),
    ).toEqual({
      endsAt: '2026-11-01T09:00:00.000Z',
      key: '2026-10-31',
      startsAt: '2026-10-31T08:00:00.000Z',
    });
  });

  it.each([
    [
      'Europe/London',
      '2026-03-29T02:00:00.000Z',
      '2026-03-28T04:00:00.000Z',
    ],
    [
      'Pacific/Auckland',
      '2026-09-26T16:00:00.000Z',
      '2026-09-26T15:00:00.000Z',
    ],
  ])('supports representative zone %s', (timeZone, instant, startsAt) => {
    expect(
      getRoutineDayWindow(new Date(instant), {
        dayStartMinute: 4 * 60,
        timeZone,
      }).startsAt,
    ).toBe(startsAt);
  });

  it('uses a supplied clock instead of reading time directly in domain rules', () => {
    expect(
      getCurrentRoutineDayWindow(seoulAtFour, {
        now: () => new Date('2026-07-12T18:00:00.000Z'),
      }).key,
    ).toBe('2026-07-12');
  });

  it('returns the end of the current routine window as the next safe settings boundary', () => {
    expect(
      getNextRoutineDayStart(new Date('2026-07-12T18:00:00.000Z'), seoulAtFour),
    ).toBe('2026-07-12T19:00:00.000Z');
  });

  it('calculates the remaining routine-day time by minutes and formats the local end time', () => {
    expect(
      getRoutineDayTiming(new Date('2026-07-12T18:30:01.000Z'), seoulAtFour),
    ).toMatchObject({
      endsAt: '2026-07-12T19:00:00.000Z',
      remainingHours: 0,
      remainingMinutes: 30,
      remainingTotalMinutes: 30,
    });
    expect(getMillisecondsUntilNextMinute(new Date('2026-07-12T18:30:01.250Z'))).toBe(
      58_750,
    );
    expect(
      formatRoutineDayEndTime(
        '2026-07-12T19:00:00.000Z',
        'en-US',
        'Asia/Seoul',
      ),
    ).toBe('4:00 AM');
  });

  it('rejects invalid day-start and time-zone inputs', () => {
    expect(() =>
      getRoutineDayWindow(new Date(), {
        dayStartMinute: 1440,
        timeZone: 'Asia/Seoul',
      }),
    ).toThrow(RangeError);
    expect(() =>
      getRoutineDayWindow(new Date(), {
        dayStartMinute: 0,
        timeZone: 'Not/A_TimeZone',
      }),
    ).toThrow(RangeError);
  });
});
