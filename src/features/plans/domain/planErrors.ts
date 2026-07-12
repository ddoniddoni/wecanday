export type PlanErrorCode =
  | 'INVALID_PLAN_INPUT'
  | 'INVALID_ROUTINE_STATUS'
  | 'INVALID_ROUTINE_SCHEDULE'
  | 'PLAN_NOT_FOUND'
  | 'ROUTINE_NOT_FOUND'
  | 'PLAN_CREATION_FAILED'
  | 'PLAN_LIST_FAILED'
  | 'ROUTINE_LIMIT_REACHED';

export type PlanListErrorCode = 'PLAN_LIST_FAILED';
export type RoutineCreationErrorCode =
  | 'INVALID_PLAN_INPUT'
  | 'INVALID_ROUTINE_STATUS'
  | 'INVALID_ROUTINE_SCHEDULE'
  | 'PLAN_NOT_FOUND'
  | 'ROUTINE_NOT_FOUND'
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

export function getPlanListErrorCode(error: unknown): PlanListErrorCode {
  return error instanceof PlanDomainError && error.code === 'PLAN_LIST_FAILED'
    ? error.code
    : 'PLAN_LIST_FAILED';
}

export function getRoutineCreationErrorCode(error: unknown): RoutineCreationErrorCode {
  if (!(error instanceof PlanDomainError)) {
    return 'PLAN_CREATION_FAILED';
  }

  return error.code === 'INVALID_PLAN_INPUT' ||
    error.code === 'INVALID_ROUTINE_STATUS' ||
    error.code === 'INVALID_ROUTINE_SCHEDULE' ||
    error.code === 'PLAN_NOT_FOUND' ||
    error.code === 'ROUTINE_NOT_FOUND' ||
    error.code === 'ROUTINE_LIMIT_REACHED'
    ? error.code
    : 'PLAN_CREATION_FAILED';
}
