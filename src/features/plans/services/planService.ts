import type { SupabaseClient } from '@supabase/supabase-js';

import { PlanDomainError } from '@/features/plans/domain/planErrors';
import type { Database } from '@/lib/supabase/database.types';

export type CreatePlanWithRoutineInput = {
  planTitle: string;
  routineTitle: string;
  scheduleWeekdays: number[];
  startsOn: string;
};

export async function createPlanWithRoutine(
  client: SupabaseClient<Database>,
  input: CreatePlanWithRoutineInput,
): Promise<void> {
  const { error } = await client.rpc('create_plan_with_routine', {
    p_plan_title: input.planTitle,
    p_routine_title: input.routineTitle,
    p_schedule_weekdays: input.scheduleWeekdays,
    p_starts_on: input.startsOn,
  });

  if (!error) {
    return;
  }

  if (error.message.includes('ROUTINE_LIMIT_REACHED')) {
    throw new PlanDomainError('ROUTINE_LIMIT_REACHED');
  }

  if (error.message.includes('INVALID_ROUTINE_SCHEDULE')) {
    throw new PlanDomainError('INVALID_ROUTINE_SCHEDULE');
  }

  if (error.message.includes('INVALID_PLAN_INPUT')) {
    throw new PlanDomainError('INVALID_PLAN_INPUT');
  }

  throw new PlanDomainError('PLAN_CREATION_FAILED');
}
