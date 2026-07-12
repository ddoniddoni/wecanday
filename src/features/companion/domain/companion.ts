export type CompanionState = 'celebrating' | 'encouraging' | 'resting';

export function getCompanionState(input: {
  completedCount: number;
  totalCount: number;
}): CompanionState {
  if (input.totalCount > 0 && input.completedCount === input.totalCount) {
    return 'celebrating';
  }

  return input.completedCount > 0 ? 'encouraging' : 'resting';
}
