export type PlanErrorCode =
  | 'INVALID_PLAN_INPUT'
  | 'INVALID_ROUTINE_SCHEDULE'
  | 'PLAN_CREATION_FAILED'
  | 'ROUTINE_LIMIT_REACHED';

export class PlanDomainError extends Error {
  constructor(public readonly code: PlanErrorCode) {
    super(code);
    this.name = 'PlanDomainError';
  }
}

export function getPlanErrorCode(error: unknown): PlanErrorCode {
  return error instanceof PlanDomainError ? error.code : 'PLAN_CREATION_FAILED';
}
