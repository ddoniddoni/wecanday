import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { TodayRoutineScreen } from '@/features/check-ins/TodayRoutineScreen';
import { FriendCodeSearchScreen } from '@/features/friends/FriendCodeSearchScreen';
import { FriendRequestsScreen } from '@/features/friends/FriendRequestsScreen';
import { AnnualStatisticsScreen } from '@/features/statistics/AnnualStatisticsScreen';
import { MonthlyStatisticsScreen } from '@/features/statistics/MonthlyStatisticsScreen';
import { WeeklyStatisticsScreen } from '@/features/statistics/WeeklyStatisticsScreen';
import { ThemeSelectionScreen } from '@/features/settings/ThemeSelectionScreen';
import { saveThemePreference } from '@/features/settings/services/themePreferenceService';
import { NotificationPermissionScreen } from '@/features/notifications/NotificationPermissionScreen';
import { cancelRoutineReminder, synchronizeRoutineReminder } from '@/features/notifications/services/routineReminderService';
import { synchronizeActiveRoutineReminders } from '@/features/notifications/services/routineReminderSynchronizationService';
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
import { i18n } from '@/i18n';
import { supabaseClient } from '@/lib/supabase/client';
import { useTheme } from '@/theme/ThemeProvider';
import { isThemePreference } from '@/theme/types';

type AppScreen =
  | 'notification-permission'
  | 'plan-create'
  | 'plan-list'
  | 'routine-create'
  | 'routine-edit'
  | 'annual-statistics'
  | 'friend-search'
  | 'friend-requests'
  | 'monthly-statistics'
  | 'theme-selection'
  | 'weekly-statistics'
  | 'today';
type PlanCreationReturnScreen = 'plan-list' | 'today';

export function ProfileHomeScreen() {
  const auth = useAuth();
  const { setPreference } = useTheme();
  const profileForReminderSync = auth.status === 'signed_in' ? auth.profile : null;
  const userIdForReminderSync = auth.status === 'signed_in' ? auth.userId : null;
  const [hasSignOutError, setHasSignOutError] = useState(false);
  const [hasPlanCreationSuccess, setHasPlanCreationSuccess] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('today');
  const [planCreationReturnScreen, setPlanCreationReturnScreen] =
    useState<PlanCreationReturnScreen>('today');
  const [selectedPlan, setSelectedPlan] = useState<PlanListItem | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<{
    id: string;
    reminder_minute: number | null;
    returnTo: 'plans' | 'today';
    schedule_weekdays: number[];
    status: 'active' | 'paused';
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!supabaseClient || !profileForReminderSync || !userIdForReminderSync) {
      return;
    }

    const client = supabaseClient;
    const synchronize = () => {
      void synchronizeActiveRoutineReminders(client);
    };

    synchronize();
    i18n.on('languageChanged', synchronize);

    return () => {
      i18n.off('languageChanged', synchronize);
    };
  }, [
    profileForReminderSync?.day_start_minute,
    profileForReminderSync?.locale,
    profileForReminderSync?.time_zone,
    profileForReminderSync,
    userIdForReminderSync,
  ]);

  useEffect(() => {
    if (profileForReminderSync && isThemePreference(profileForReminderSync.theme_id)) {
      setPreference(profileForReminderSync.theme_id);
    }
  }, [profileForReminderSync, setPreference]);

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
  if (screen === 'theme-selection') {
    return (
      <ThemeSelectionScreen
        onBack={() => setScreen('today')}
        onSave={async (preference) => {
          if (!supabaseClient) {
            throw new Error('THEME_PREFERENCE_SAVE_FAILED');
          }

          const profile = await saveThemePreference(
            supabaseClient,
            authenticatedUserId,
            preference,
          );
          auth.replaceProfile(profile);
          setPreference(preference);
        }}
      />
    );
  }
  if (screen === 'friend-search') {
    if (!supabaseClient) {
      return null;
    }

    return (
      <FriendCodeSearchScreen
        client={supabaseClient}
        onBack={() => setScreen('today')}
        onOpenRequests={() => setScreen('friend-requests')}
      />
    );
  }
  if (screen === 'friend-requests') {
    if (!supabaseClient) {
      return null;
    }

    return <FriendRequestsScreen client={supabaseClient} onBack={() => setScreen('friend-search')} />;
  }
  if (screen === 'weekly-statistics') {
    if (!supabaseClient) {
      return null;
    }

    return (
      <WeeklyStatisticsScreen
        client={supabaseClient}
        onBack={() => setScreen('today')}
        routineDayConfig={{
          dayStartMinute: auth.profile.day_start_minute,
          timeZone: auth.profile.time_zone,
        }}
        userId={authenticatedUserId}
      />
    );
  }
  if (screen === 'monthly-statistics') {
    if (!supabaseClient) {
      return null;
    }

    return (
      <MonthlyStatisticsScreen
        client={supabaseClient}
        onBack={() => setScreen('today')}
        routineDayConfig={{
          dayStartMinute: auth.profile.day_start_minute,
          timeZone: auth.profile.time_zone,
        }}
        userId={authenticatedUserId}
      />
    );
  }
  if (screen === 'annual-statistics') {
    if (!supabaseClient) {
      return null;
    }

    return (
      <AnnualStatisticsScreen
        client={supabaseClient}
        onBack={() => setScreen('today')}
        routineDayConfig={{
          dayStartMinute: auth.profile.day_start_minute,
          timeZone: auth.profile.time_zone,
        }}
        userId={authenticatedUserId}
      />
    );
  }
  if (screen === 'routine-edit' && selectedRoutine) {
    const returnScreen = selectedRoutine.returnTo === 'plans' ? 'plan-list' : 'today';

    return (
      <RoutineCreateScreen
        initialRoutineTitle={selectedRoutine.title}
        initialReminderMinute={selectedRoutine.reminder_minute}
        initialScheduleWeekdays={selectedRoutine.schedule_weekdays}
        mode="edit"
        onArchive={async () => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          await archiveRoutineItem(supabaseClient, selectedRoutine.id);
          await cancelRoutineReminder(selectedRoutine.id);
        }}
        onBack={() => setScreen(returnScreen)}
        onChangeStatus={async (status) => {
          if (!supabaseClient) {
            throw new PlanDomainError('PLAN_CREATION_FAILED');
          }

          await setRoutineItemStatus(supabaseClient, selectedRoutine.id, status);
          if (status === 'paused') {
            await cancelRoutineReminder(selectedRoutine.id);
            return;
          }

          await synchronizeRoutineReminder({
            reminderMinute: selectedRoutine.reminder_minute,
            routineId: selectedRoutine.id,
            scheduleWeekdays: selectedRoutine.schedule_weekdays,
          });
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
            reminder_minute: routine.reminder_minute,
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
      onOpenFriendSearch={() => setScreen('friend-search')}
      onOpenPlans={() => setScreen('plan-list')}
      onOpenAnnualStatistics={() => setScreen('annual-statistics')}
      onOpenMonthlyStatistics={() => setScreen('monthly-statistics')}
      onOpenThemes={() => setScreen('theme-selection')}
      onOpenWeeklyStatistics={() => setScreen('weekly-statistics')}
      onRoutineCompletionChanged={(routine, isCompleted) => {
        if (isCompleted) {
          void cancelRoutineReminder(routine.id);
          return;
        }

        void synchronizeRoutineReminder({
          reminderMinute: routine.reminder_minute,
          routineId: routine.id,
          scheduleWeekdays: routine.schedule_weekdays,
        });
      }}
      onSignOut={() => void handleSignOut()}
      publicCode={auth.profile.public_code}
      routineDayConfig={{
        dayStartMinute: auth.profile.day_start_minute,
        timeZone: auth.profile.time_zone,
      }}
      userId={auth.userId}
    />
  );
}
