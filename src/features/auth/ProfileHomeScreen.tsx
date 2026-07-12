import { useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { TodayRoutineScreen } from '@/features/check-ins/TodayRoutineScreen';
import { PlanCreateScreen } from '@/features/plans/PlanCreateScreen';
import { PlanDomainError } from '@/features/plans/domain/planErrors';
import { createPlanWithRoutine } from '@/features/plans/services/planService';
import { getCurrentRoutineDayWindow } from '@/features/routine-day/domain/routineDay';
import { RoutineDaySetupScreen } from '@/features/routine-day/RoutineDaySetupScreen';
import { completeInitialRoutineDaySettings } from '@/features/routine-day/services/routineDaySettingsService';
import { supabaseClient } from '@/lib/supabase/client';

export function ProfileHomeScreen() {
  const auth = useAuth();
  const [hasSignOutError, setHasSignOutError] = useState(false);
  const [hasPlanCreationSuccess, setHasPlanCreationSuccess] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  if (auth.status !== 'signed_in') {
    return null;
  }

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

  if (isCreatingPlan) {
    const startsOn = getCurrentRoutineDayWindow({
      dayStartMinute: auth.profile.day_start_minute,
      timeZone: auth.profile.time_zone,
    }).key;

    return (
      <PlanCreateScreen
        onComplete={() => {
          setHasPlanCreationSuccess(true);
          setIsCreatingPlan(false);
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

  return (
    <TodayRoutineScreen
      client={supabaseClient}
      displayName={auth.profile.display_name}
      hasPlanCreationSuccess={hasPlanCreationSuccess}
      hasSignOutError={hasSignOutError}
      onCreatePlan={() => setIsCreatingPlan(true)}
      onSignOut={() => void handleSignOut()}
      routineDayConfig={{
        dayStartMinute: auth.profile.day_start_minute,
        timeZone: auth.profile.time_zone,
      }}
      userId={auth.userId}
    />
  );
}
