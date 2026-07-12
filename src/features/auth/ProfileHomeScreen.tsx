import { useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { TodayRoutineScreen } from '@/features/check-ins/TodayRoutineScreen';
import { NotificationPermissionScreen } from '@/features/notifications/NotificationPermissionScreen';
import { cancelRoutineReminder, synchronizeRoutineReminder } from '@/features/notifications/services/routineReminderService';
import {
  markNotificationPermissionPrimerHandled,
  requestRoutineNotificationPermission,
  shouldShowNotificationPermissionPrimer,
} from '@/features/notifications/services/notificationPermissionService';
import { PlanCreateScreen } from '@/features/plans/PlanCreateScreen';
import { PlanListScreen } from '@/features/plans/PlanListScreen';
import { RoutineCreateScreen } from '@/features/plans/RoutineCreateScreen';
import { PlanDomainError } from '@/features/plans/domain/planErrors';
import {
  addRoutineItem,
  archivePlan,
  archiveRoutineItem,
  createPlanWithRoutine,
  setRoutineItemStatus,
  updateRoutineItem,
  type PlanListItem,
} from '@/features/plans/services/planService';
import { getCurrentRoutineDayWindow } from '@/features/routine-day/domain/routineDay';
import { RoutineDaySetupScreen } from '@/features/routine-day/RoutineDaySetupScreen';
import { completeInitialRoutineDaySettings } from '@/features/routine-day/services/routineDaySettingsService';
import { supabaseClient } from '@/lib/supabase/client';

type AppScreen =
  | 'notification-permission'
  | 'plan-create'
  | 'plan-list'
  | 'routine-create'
  | 'routine-edit'
  | 'today';
type PlanCreationReturnScreen = 'plan-list' | 'today';

export function ProfileHomeScreen() {
  const auth = useAuth();
  const [hasSignOutError, setHasSignOutError] = useState(false);
  const [hasPlanCreationSuccess, setHasPlanCreationSuccess] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('today');
  const [planCreationReturnScreen, setPlanCreationReturnScreen] =
    useState<PlanCreationReturnScreen>('today');
  const [selectedPlan, setSelectedPlan] = useState<PlanListItem | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<{
    id: string;
    returnTo: 'plans' | 'today';
    schedule_weekdays: number[];
    status: 'active' | 'paused';
    title: string;
  } | null>(null);

  if (auth.status !== 'signed_in') {
    return null;
  }

  const authenticatedUserId = auth.userId;

  if (
    auth.profile.time_zone === null ||
    auth.profile.day_start_minute === null ||
    auth.profile.routine_day_settings_completed_at === null
  ) {
    return (
      <RoutineDaySetupScreen
        onSave={async (config) => {
          if (!supabaseClient) {
            throw new Error('Supabase client is unavailable.');
          }

          const profile = await completeInitialRoutineDaySettings(
            supabaseClient,
            config,
          );

          auth.replaceProfile(profile);
        }}
      />
    );
  }

  function showPlanCreation(returnScreen: PlanCreationReturnScreen) {
    setPlanCreationReturnScreen(returnScreen);
    setScreen('plan-create');
  }

  async function completePlanCreation(returnScreen: PlanCreationReturnScreen) {
    setHasPlanCreationSuccess(true);

    if (
      returnScreen === 'today' &&
      await shouldShowNotificationPermissionPrimer(authenticatedUserId)
    ) {
      setScreen('notification-permission');
      return;
    }

    setScreen(returnScreen);
  }

  if (screen === 'plan-create') {
    const startsOn = getCurrentRoutineDayWindow({
      dayStartMinute: auth.profile.day_start_minute,
      timeZone: auth.profile.time_zone,
    }).key;

    return (
      <PlanCreateScreen
        onComplete={() => {
          void completePlanCreation(planCreationReturnScreen);
        }}
        onSave={async (input) => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          await createPlanWithRoutine(supabaseClient, { ...input, startsOn });
        }}
      />
    );
  }

  if (screen === 'routine-create' && selectedPlan) {
    return (
      <RoutineCreateScreen
        onBack={() => setScreen('plan-list')}
        onComplete={() => setScreen('plan-list')}
        onSave={async (input) => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          const routine = await addRoutineItem(supabaseClient, {
            ...input,
            planId: selectedPlan.id,
          });
          await synchronizeRoutineReminder({ reminderMinute: routine.reminder_minute, routineId: routine.id, scheduleWeekdays: routine.schedule_weekdays });
        }}
        planTitle={selectedPlan.title}
      />
    );
  }

  if (screen === 'notification-permission') {
    return (
      <NotificationPermissionScreen
        onAllow={async () => {
          const result = await requestRoutineNotificationPermission();

          await markNotificationPermissionPrimerHandled(authenticatedUserId);
          return result;
        }}
        onContinue={() => setScreen('today')}
        onNotNow={() => {
          void markNotificationPermissionPrimerHandled(authenticatedUserId);
          setScreen('today');
        }}
      />
    );
  }
  if (screen === 'routine-edit' && selectedRoutine) {
    const returnScreen = selectedRoutine.returnTo === 'plans' ? 'plan-list' : 'today';

    return (
      <RoutineCreateScreen
        initialRoutineTitle={selectedRoutine.title}
        initialScheduleWeekdays={selectedRoutine.schedule_weekdays}
        mode="edit"
        onArchive={async () => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          await archiveRoutineItem(supabaseClient, selectedRoutine.id);
          await cancelRoutineReminder(selectedRoutine.id, selectedRoutine.schedule_weekdays);
        }}
        onBack={() => setScreen(returnScreen)}
        onChangeStatus={async (status) => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          await setRoutineItemStatus(supabaseClient, selectedRoutine.id, status);
          if (status === 'paused') await cancelRoutineReminder(selectedRoutine.id, selectedRoutine.schedule_weekdays);
        }}
        onComplete={() => setScreen(returnScreen)}
        onSave={async (input) => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          const routine = await updateRoutineItem(supabaseClient, {
            ...input,
            routineId: selectedRoutine.id,
          });
          await synchronizeRoutineReminder({ reminderMinute: routine.reminder_minute, routineId: routine.id, scheduleWeekdays: routine.schedule_weekdays });
        }}
        planTitle=""
        returnTo={selectedRoutine.returnTo}
        routineStatus={selectedRoutine.status}
      />
    );
  }

  async function handleSignOut() {
    setHasSignOutError(false);

    try {
      await auth.signOut();
    } catch {
      setHasSignOutError(true);
    }
  }

  if (!supabaseClient) {
    return null;
  }

  if (screen === 'plan-list') {
    return (
      <PlanListScreen
        client={supabaseClient}
        onAddRoutine={(plan) => {
          setSelectedPlan(plan);
          setScreen('routine-create');
        }}
        onBack={() => setScreen('today')}
        onCreatePlan={() => showPlanCreation('plan-list')}
        onArchivePlan={async (planId) => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          await archivePlan(supabaseClient, planId);
        }}
        onEditRoutine={(_plan, routine) => {
          const routineStatus = routine.status;

          if (routineStatus === 'archived') {
            return;
          }

          setSelectedRoutine({
            id: routine.id,
            returnTo: 'plans',
            schedule_weekdays: routine.schedule_weekdays,
            status: routineStatus,
            title: routine.title,
          });
          setScreen('routine-edit');
        }}
      />
    );
  }

  return (
    <TodayRoutineScreen
      client={supabaseClient}
      displayName={auth.profile.display_name}
      hasPlanCreationSuccess={hasPlanCreationSuccess}
      hasSignOutError={hasSignOutError}
      onCreatePlan={() => showPlanCreation('today')}
      onEditRoutine={(routine) => {
        setSelectedRoutine({
          ...routine,
          returnTo: 'today',
          status: 'active',
        });
        setScreen('routine-edit');
      }}
      onOpenPlans={() => setScreen('plan-list')}
      onRoutineCompleted={(routine) => {
        void cancelRoutineReminder(routine.id, routine.schedule_weekdays);
      }}
      onSignOut={() => void handleSignOut()}
      routineDayConfig={{
        dayStartMinute: auth.profile.day_start_minute,
        timeZone: auth.profile.time_zone,
      }}
      userId={auth.userId}
    />
  );
}
