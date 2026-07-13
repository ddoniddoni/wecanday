import { addDays, format, isValid, parseISO } from 'date-fns';

import { ChallengeDomainError } from '@/features/challenges/domain/challengeErrors';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ChallengeInput = {
  endsOn: string;
  friendId: string;
  scheduleWeekdays: number[];
  startsOn: string;
  title: string;
};

export function getDefaultChallengeEndsOn(startsOn: string): string {
  const start = parseChallengeDate(startsOn);

  return format(addDays(start, 6), 'yyyy-MM-dd');
}

export function validateChallengeInput(input: ChallengeInput): ChallengeInput {
  const startsOn = input.startsOn.trim();
  const endsOn = input.endsOn.trim();
  const title = input.title.trim();
  const scheduleWeekdays = [...new Set(input.scheduleWeekdays)].sort((left, right) => left - right);

  if (
    input.friendId.length === 0 ||
    title.length === 0 ||
    title.length > 80 ||
    scheduleWeekdays.length === 0 ||
    scheduleWeekdays.some((weekday) => !Number.isInteger(weekday) || weekday < 0 || weekday > 6)
  ) {
    throw new ChallengeDomainError('INVALID_CHALLENGE_INPUT');
  }

  const start = parseChallengeDate(startsOn);
  const end = parseChallengeDate(endsOn);

  if (end.getTime() < start.getTime()) {
    throw new ChallengeDomainError('INVALID_CHALLENGE_INPUT');
  }

  return { endsOn, friendId: input.friendId, scheduleWeekdays, startsOn, title };
}

function parseChallengeDate(value: string): Date {
  if (!DATE_PATTERN.test(value)) {
    throw new ChallengeDomainError('INVALID_CHALLENGE_INPUT');
  }

  const parsed = parseISO(value);

  if (!isValid(parsed) || format(parsed, 'yyyy-MM-dd') !== value) {
    throw new ChallengeDomainError('INVALID_CHALLENGE_INPUT');
  }

  return parsed;
}
