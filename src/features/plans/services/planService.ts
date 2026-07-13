import type { SupabaseClient } from '@supabase/supabase-js';

import { PlanDomainError } from '@/features/plans/domain/planErrors';
import type {
  Database,
  PlanRow,
  RoutineItemRow,
} from '@/lib/supabase/database.types';

export type CreatePlanWithRoutineInput = {
  planTitle: string;
  routineTitle: string;
  scheduleWeekdays: number[];
  startsOn: string;
};

export type PlanListItem = Pick<
  PlanRow,
  'ends_on' | 'id' | 'starts_on' | 'status' | 'title'
> & {
  activeRoutineCount: number;
  routineItems: PlanRoutineItem[];
};

export type AddRoutineItemInput = {
  planId: string;
  reminderMinute: number | null;
  routineTitle: string;
  scheduleWeekdays: number[];
};

export type PlanRoutineItem = Omit<Pick<
  RoutineItemRow,
  'id' | 'reminder_minute' | 'schedule_weekdays' | 'status' | 'title'
>, 'status'> & {
  status: 'active' | 'archived' | 'paused';
};

export type UpdateRoutineItemInput = {
  reminderMinute: number | null;
  routineId: string;
  routineTitle: string;
  scheduleWeekdays: number[];
};

export async function loadPlans(
  client: SupabaseClient<Database>,
): Promise<PlanListItem[]> {
  const [plansResult, routinesResult] = await Promise.all([
    client
      .from('plans')
      .select('ends_on, id, starts_on, status, title')
      .order('updated_at', { ascending: false }),
    client
      .from('routine_items')
      .select('id, plan_id, reminder_minute, schedule_weekdays, status, title')
      .order('created_at', { ascending: true }),
  ]);

  if (
    plansResult.error ||
    routinesResult.error ||
    !plansResult.data ||
    !routinesResult.data
  ) {
    throw new PlanDomainError('PLAN_LIST_FAILED');
  }

  const activeRoutineCounts = new Map<string, number>();
  const routineItemsByPlanId = new Map<string, PlanRoutineItem[]>();

  for (const routine of routinesResult.data) {
    if (
      routine.status !== 'active' &&
      routine.status !== 'archived' &&
      routine.status !== 'paused'
    ) {
      continue;
    }

    const routineItems = routineItemsByPlanId.get(routine.plan_id) ?? [];

    routineItems.push({
      id: routine.id,
      reminder_minute: routine.reminder_minute,
      schedule_weekdays: routine.schedule_weekdays,
      status: routine.status,
      title: routine.title,
    });
    routineItemsByPlanId.set(routine.plan_id, routineItems);

    if (routine.status === 'active') {
      activeRoutineCounts.set(
        routine.plan_id,
        (activeRoutineCounts.get(routine.plan_id) ?? 0) + 1,
      );
    }
  }

  return plansResult.data.map((plan) => ({
    ...plan,
    activeRoutineCount: activeRoutineCounts.get(plan.id) ?? 0,
    routineItems: routineItemsByPlanId.get(plan.id) ?? [],
  }));
}

export async function addRoutineItem(
  client: SupabaseClient<Database>,
  input: AddRoutineItemInput,
): Promise<RoutineItemRow> {
  const { data, error } = await client.rpc('add_routine_item', {
    p_plan_id: input.planId,
    p_reminder_minute: input.reminderMinute,
    p_routine_title: input.routineTitle,
    p_schedule_weekdays: input.scheduleWeekdays,
  });

  if (!error && data) {
    return data;
  }

  if (error.message.includes('ROUTINE_LIMIT_REACHED')) {
    throw new PlanDomainError('ROUTINE_LIMIT_REACHED');
  }

  if (error.message.includes('INVALID_ROUTINE_SCHEDULE')) {
    throw new PlanDomainError('INVALID_ROUTINE_SCHEDULE');
  }

  if (error.message.includes('PLAN_NOT_FOUND')) {
    throw new PlanDomainError('PLAN_NOT_FOUND');
  }

  if (error.message.includes('INVALID_PLAN_INPUT')) {
    throw new PlanDomainError('INVALID_PLAN_INPUT');
  }

  throw new PlanDomainError('PLAN_CREATION_FAILED');
}

export async function updateRoutineItem(
  client: SupabaseClient<Database>,
  input: UpdateRoutineItemInput,
): Promise<RoutineItemRow> {
  const { data, error } = await client.rpc('update_routine_item', {
    p_routine_item_id: input.routineId,
    p_reminder_minute: input.reminderMinute,
    p_routine_title: input.routineTitle,
    p_schedule_weekdays: input.scheduleWeekdays,
  });
  if (!error && data) {
    return data;
  }

  if (error.message.includes('INVALID_ROUTINE_SCHEDULE')) {
    throw new PlanDomainError('INVALID_ROUTINE_SCHEDULE');
  }

  if (error.message.includes('ROUTINE_NOT_FOUND')) {
    throw new PlanDomainError('ROUTINE_NOT_FOUND');
  }

  if (error.message.includes('INVALID_PLAN_INPUT')) {
    throw new PlanDomainError('INVALID_PLAN_INPUT');
  }

  throw new PlanDomainError('PLAN_CREATION_FAILED');
}

export async function setRoutineItemStatus(
  client: SupabaseClient<Database>,
  routineId: string,
  status: 'active' | 'paused',
): Promise<void> {
  const { error } = await client.rpc('set_routine_item_status', {
    p_routine_item_id: routineId,
    p_status: status,
  });

  if (!error) {
    return;
  }

  if (error.message.includes('ROUTINE_LIMIT_REACHED')) {
    throw new PlanDomainError('ROUTINE_LIMIT_REACHED');
  }

  if (error.message.includes('ROUTINE_NOT_FOUND')) {
    throw new PlanDomainError('ROUTINE_NOT_FOUND');
  }

  if (error.message.includes('INVALID_ROUTINE_STATUS')) {
    throw new PlanDomainError('INVALID_ROUTINE_STATUS');
  }

  throw new PlanDomainError('PLAN_CREATION_FAILED');
}

export async function archiveRoutineItem(
  client: SupabaseClient<Database>,
  routineId: string,
): Promise<void> {
  const { error } = await client.rpc('archive_routine_item', {
    p_routine_item_id: routineId,
  });

  if (!error) {
    return;
  }

  if (error.message.includes('ROUTINE_NOT_FOUND')) {
    throw new PlanDomainError('ROUTINE_NOT_FOUND');
  }

  throw new PlanDomainError('PLAN_CREATION_FAILED');
}

export async function archivePlan(
  client: SupabaseClient<Database>,
  planId: string,
): Promise<void> {
  const { error } = await client.rpc('archive_plan', { p_plan_id: planId });

  if (!error) {
    return;
  }

  if (error.message.includes('PLAN_NOT_FOUND')) {
    throw new PlanDomainError('PLAN_NOT_FOUND');
  }

  throw new PlanDomainError('PLAN_CREATION_FAILED');
}

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
