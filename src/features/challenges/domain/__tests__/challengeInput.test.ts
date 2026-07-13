import {
  getDefaultChallengeEndsOn,
  validateChallengeInput,
} from '@/features/challenges/domain/challengeInput';
import { ChallengeDomainError } from '@/features/challenges/domain/challengeErrors';

describe('challenge input', () => {
  it('creates a seven-day default period from the selected routine day', () => {
    expect(getDefaultChallengeEndsOn('2026-07-14')).toBe('2026-07-20');
  });

  it('rejects invalid dates, empty schedules, and inverted periods', () => {
    expect(() => validateChallengeInput({
      endsOn: '2026-02-29',
      friendId: 'friend-1',
      scheduleWeekdays: [1],
      startsOn: '2026-02-28',
      title: 'Walk',
    })).toThrow(ChallengeDomainError);
    expect(() => validateChallengeInput({
      endsOn: '2026-07-13',
      friendId: 'friend-1',
      scheduleWeekdays: [1],
      startsOn: '2026-07-14',
      title: 'Walk',
    })).toThrow(ChallengeDomainError);
    expect(() => validateChallengeInput({
      endsOn: '2026-07-14',
      friendId: 'friend-1',
      scheduleWeekdays: [],
      startsOn: '2026-07-14',
      title: 'Walk',
    })).toThrow(ChallengeDomainError);
  });

  it('normalizes a valid weekly schedule before sending it to the server', () => {
    expect(validateChallengeInput({
      endsOn: '2026-07-20',
      friendId: 'friend-1',
      scheduleWeekdays: [5, 1, 5],
      startsOn: '2026-07-14',
      title: ' Walk ',
    })).toEqual({
      endsOn: '2026-07-20',
      friendId: 'friend-1',
      scheduleWeekdays: [1, 5],
      startsOn: '2026-07-14',
      title: 'Walk',
    });
  });
});
