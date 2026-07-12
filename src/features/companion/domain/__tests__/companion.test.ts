import { getCompanionState } from '@/features/companion/domain/companion';

describe('getCompanionState', () => {
  it.each([
    [{ completedCount: 0, totalCount: 0 }, 'resting'],
    [{ completedCount: 0, totalCount: 3 }, 'resting'],
    [{ completedCount: 1, totalCount: 3 }, 'encouraging'],
    [{ completedCount: 3, totalCount: 3 }, 'celebrating'],
  ] as const)('maps %o to %s', (input, expectedState) => {
    expect(getCompanionState(input)).toBe(expectedState);
  });
});
