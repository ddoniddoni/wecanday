import {
  getRoutineFormIssues,
  parseReminderMinute,
} from '@/features/plans/domain/routineFormValidation';

describe('routine form validation', () => {
  it('keeps an empty reminder optional but rejects an invalid time', () => {
    expect(parseReminderMinute('')).toBeNull();
    expect(parseReminderMinute('20:00')).toBe(20 * 60);
    expect(parseReminderMinute('20000')).toBeUndefined();
  });

  it('identifies the specific fields that need attention', () => {
    expect(
      getRoutineFormIssues({
        reminderTime: '20000',
        routineTitle: 'Read a book',
        scheduleWeekdays: [0, 1],
      }),
    ).toEqual(['reminderTime']);
  });
});
