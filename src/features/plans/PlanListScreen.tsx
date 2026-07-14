import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppTabScreen } from '@/components/AppTabScreen';
import type { PrimaryNavigationActions } from '@/components/PrimaryNavigation';
import {
  getPlanErrorCode,
  getPlanListErrorCode,
  type PlanErrorCode,
  type PlanListErrorCode,
} from '@/features/plans/domain/planErrors';
import {
  loadPlans,
  type PlanListItem,
  type PlanRoutineItem,
} from '@/features/plans/services/planService';
import type { Database } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type PlanListScreenProps = {
  client: SupabaseClient<Database>;
  onAddRoutine: (plan: PlanListItem) => void;
  onBack: () => void;
  onCreatePlan: () => void;
  onEditRoutine: (plan: PlanListItem, routine: PlanRoutineItem) => void;
  onArchivePlan: (planId: string) => Promise<void>;
  primaryNavigation?: PrimaryNavigationActions;
};

function PlanListItemCard({
  onAddRoutine,
  onArchiveCancel,
  onArchiveConfirm,
  onArchiveRequest,
  isArchiveConfirmationVisible,
  isArchiving,
  onEditRoutine,
  plan,
}: {
  onAddRoutine: (plan: PlanListItem) => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: () => void;
  onArchiveRequest: () => void;
  isArchiveConfirmationVisible: boolean;
  isArchiving: boolean;
  onEditRoutine: (plan: PlanListItem, routine: PlanRoutineItem) => void;
  plan: PlanListItem;
}) {
  const { t } = useTranslation('plans');
  const { theme } = useTheme();
  const statusLabel = t(`list.statuses.${plan.status}`);
  const routineCountLabel = t('list.activeRoutineCount', {
    count: plan.activeRoutineCount,
  });

  return (
    <View
      accessibilityLabel={t('list.itemAccessibilityLabel', {
        routineCount: routineCountLabel,
        status: statusLabel,
        title: plan.title,
      })}
      style={[
        styles.planCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.planCopy}>
        <Text style={[styles.planTitle, { color: theme.colors.text }]}>{plan.title}</Text>
        <Text style={[styles.routineCount, { color: theme.colors.textMuted }]}>
          {routineCountLabel}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.statusLabel, { color: theme.colors.textMuted }]}>
          {statusLabel}
        </Text>
      </View>
      {plan.routineItems.map((routine) => {
        const isArchived = routine.status === 'archived';
        const routineContent = (
          <>
            <Text style={[styles.routineTitle, { color: theme.colors.text }]}>
              {routine.title}
            </Text>
            <Text style={[styles.routineStatus, { color: theme.colors.textMuted }]}>
              {t(`list.routineStatuses.${routine.status}`)}
            </Text>
          </>
        );

        return isArchived ? (
          <View
            key={routine.id}
            style={[styles.routineRow, { borderColor: theme.colors.border }]}
          >
            {routineContent}
          </View>
        ) : (
          <Pressable
            accessibilityLabel={t('list.editRoutine', {
              status: t(`list.routineStatuses.${routine.status}`),
              title: routine.title,
            })}
            accessibilityRole="button"
            key={routine.id}
            onPress={() => onEditRoutine(plan, routine)}
            style={({ pressed }) => [
              styles.routineRow,
              {
                borderColor: theme.colors.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            {routineContent}
          </Pressable>
        );
      })}
      {plan.status !== 'archived' ? (
        <View style={styles.planActions}>
          <Pressable
            accessibilityLabel={t('list.addRoutineToPlan', { title: plan.title })}
            accessibilityRole="button"
            onPress={() => onAddRoutine(plan)}
            style={({ pressed }) => [
              styles.addRoutineButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text style={[styles.addRoutineButtonLabel, { color: theme.colors.text }]}>
              {t('list.addRoutine')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t('list.archivePlanFor', { title: plan.title })}
            accessibilityRole="button"
            disabled={isArchiving}
            onPress={onArchiveRequest}
            style={({ pressed }) => [
              styles.addRoutineButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed || isArchiving ? 0.72 : 1,
              },
            ]}
          >
            <Text style={[styles.addRoutineButtonLabel, { color: theme.colors.text }]}>
              {t('list.archivePlan')}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {isArchiveConfirmationVisible ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.archiveConfirmation,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.archiveConfirmationTitle, { color: theme.colors.text }]}>
            {t('list.archivePlanConfirmationTitle')}
          </Text>
          <Text style={[styles.archiveConfirmationDescription, { color: theme.colors.textMuted }]}>
            {t('list.archivePlanConfirmationDescription')}
          </Text>
          <View style={styles.archiveActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isArchiving}
              onPress={onArchiveCancel}
              style={({ pressed }) => [
                styles.addRoutineButton,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed || isArchiving ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.addRoutineButtonLabel, { color: theme.colors.text }]}>
                {t('list.archivePlanCancel')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isArchiving}
              onPress={onArchiveConfirm}
              style={({ pressed }) => [
                styles.archiveConfirmButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed || isArchiving ? 0.72 : 1,
                },
              ]}
            >
              {isArchiving ? (
                <ActivityIndicator
                  accessibilityLabel={t('list.archivingPlan')}
                  color={theme.colors.onPrimary}
                />
              ) : (
                <Text style={[styles.archiveConfirmLabel, { color: theme.colors.onPrimary }]}>
                  {t('list.archivePlanConfirm')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function PlanListScreen({
  client,
  onAddRoutine,
  onBack,
  onCreatePlan,
  onEditRoutine,
  onArchivePlan,
  primaryNavigation,
}: PlanListScreenProps) {
  const { t } = useTranslation('plans');
  const { theme } = useTheme();
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<PlanListErrorCode | null>(null);
  const [archiveErrorCode, setArchiveErrorCode] = useState<PlanErrorCode | null>(null);
  const [archivePlanId, setArchivePlanId] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorCode(null);
    setArchiveErrorCode(null);

    try {
      setPlans(await loadPlans(client));
    } catch (error) {
      setErrorCode(getPlanListErrorCode(error));
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  async function handleArchivePlan() {
    if (!archivePlanId) {
      return;
    }

    setArchiveErrorCode(null);
    setIsArchiving(true);

    try {
      await onArchivePlan(archivePlanId);
      setArchivePlanId(null);
      await refresh();
    } catch (error) {
      setArchiveErrorCode(getPlanErrorCode(error));
    } finally {
      setIsArchiving(false);
    }
  }

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      clearTimeout(initialRefresh);
    };
  }, [refresh]);

  return (
    <AppTabScreen
      activeTab={primaryNavigation ? 'plans' : undefined}
      navigation={primaryNavigation}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {!primaryNavigation ? (
            <Pressable
              accessibilityLabel={t('list.back')}
              accessibilityRole="button"
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.backButtonLabel, { color: theme.colors.text }]}>
                {t('list.back')}
              </Text>
            </Pressable>
          ) : null}
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('list.title')}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator accessibilityLabel={t('list.loading')} color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.textMuted }]}>
              {t('list.loading')}
            </Text>
          </View>
        ) : null}

        {!isLoading && errorCode ? (
          <View style={styles.stateContainer}>
            <Text accessibilityRole="alert" style={[styles.stateText, { color: theme.colors.text }]}>
              {t(`errors.${errorCode}`)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void refresh()}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
                {t('list.retry')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !errorCode && archiveErrorCode ? (
          <Text accessibilityRole="alert" style={[styles.archiveError, { color: theme.colors.text }]}>
            {t(`errors.${archiveErrorCode}`)}
          </Text>
        ) : null}

        {!isLoading && !errorCode && plans.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={[styles.stateText, { color: theme.colors.text }]}>
              {t('list.emptyTitle')}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {t('list.emptyDescription')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onCreatePlan}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.primaryButtonLabel, { color: theme.colors.onPrimary }]}>
                {t('list.createPlan')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !errorCode && plans.length > 0 ? (
          <View style={styles.planList}>
            {plans.map((plan) => (
              <PlanListItemCard
                key={plan.id}
                onAddRoutine={onAddRoutine}
                onArchiveCancel={() => setArchivePlanId(null)}
                onArchiveConfirm={() => void handleArchivePlan()}
                onArchiveRequest={() => setArchivePlanId(plan.id)}
                onEditRoutine={onEditRoutine}
                isArchiveConfirmationVisible={archivePlanId === plan.id}
                isArchiving={isArchiving && archivePlanId === plan.id}
                plan={plan}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={onCreatePlan}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={[styles.primaryButtonLabel, { color: theme.colors.onPrimary }]}>
                {t('list.createPlan')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  header: { gap: spacing.sm },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 180, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  planList: { gap: spacing.sm },
  planCard: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  planCopy: { flex: 1, gap: spacing.xs },
  planTitle: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  routineCount: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  statusBadge: { borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  statusLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  routineRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', minHeight: touchTarget.minimum, paddingVertical: spacing.sm },
  routineTitle: { flex: 1, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  routineStatus: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  planActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  addRoutineButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  addRoutineButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  archiveConfirmation: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  archiveConfirmationTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  archiveConfirmationDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  archiveActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  archiveConfirmButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  archiveConfirmLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  archiveError: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  primaryButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  primaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  secondaryButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  secondaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
