import type { SupabaseClient } from '@supabase/supabase-js';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
import { JourneyHeader } from '@/components/JourneyHeader';
import type { PrimaryNavigationActions } from '@/components/PrimaryNavigation';
import type { CompanionId } from '@/features/companion/domain/companions';
import { loadCompanionProgress } from '@/features/companion/services/companionProgressService';
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
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

type PlanListScreenProps = {
  client: SupabaseClient<Database>;
  companionId?: CompanionId;
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
      <View style={[styles.planCopy, plan.routineItems.length > 0 && styles.hiddenPlanMeta]}>
        <Text style={[styles.planTitle, { color: theme.colors.text }]}>{plan.title}</Text>
        <Text style={[styles.routineCount, { color: theme.colors.textMuted }]}>
          {routineCountLabel}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          plan.routineItems.length > 0 && styles.hiddenPlanMeta,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.statusLabel, { color: theme.colors.textMuted }]}>
          {statusLabel}
        </Text>
      </View>
      {plan.routineItems.map((routine, index) => {
        const isArchived = routine.status === 'archived';
        const iconColor = index % 2 === 0 ? palette.lightSecondary : theme.colors.accent;
        const routineContent = (
          <>
            <View style={[styles.routineIcon, { backgroundColor: `${iconColor}22` }]}>
              <MaterialIcons
                color={isArchived ? theme.colors.textMuted : iconColor}
                name={index % 2 === 0 ? 'delete-outline' : 'directions-run'}
                size={22}
              />
            </View>
            <View style={styles.routineText}>
              <Text
                style={[
                  styles.routineTitle,
                  {
                    color: theme.colors.text,
                    textDecorationLine: isArchived ? 'line-through' : 'none',
                  },
                ]}
              >
                {routine.title}
              </Text>
              <Text style={[styles.routineStatus, { color: theme.colors.textMuted }]}>
                {t(`list.routineStatuses.${routine.status}`)}
              </Text>
            </View>
            {!isArchived ? (
              <Pressable
                accessibilityLabel={t('list.archivePlanFor', { title: plan.title })}
                accessibilityRole="button"
                disabled={isArchiving}
                onPress={(event) => {
                  event.stopPropagation();
                  onArchiveRequest();
                }}
                style={({ pressed }) => [styles.moreButton, { opacity: pressed || isArchiving ? 0.56 : 1 }]}
              >
                <MaterialIcons color={theme.colors.text} name="more-vert" size={22} />
              </Pressable>
            ) : null}
          </>
        );

        return isArchived ? (
          <View
            key={routine.id}
            style={[styles.routineRow, { borderColor: theme.colors.border }]}
          >
            <View style={[styles.routineMarker, { borderColor: theme.colors.border }]} />
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
            <View
              style={[
                styles.routineMarker,
                {
                  backgroundColor: routine.status === 'active'
                    ? theme.colors.primary
                    : theme.colors.background,
                  borderColor: routine.status === 'active'
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            />
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
  companionId = 'sprout',
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
  const [experience, setExperience] = useState(0);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorCode(null);
    setArchiveErrorCode(null);

    try {
      const [nextPlans, companionProgress] = await Promise.all([
        loadPlans(client),
        loadCompanionProgress(client).catch(() => null),
      ]);

      setPlans(nextPlans);
      if (companionProgress) setExperience(companionProgress.experience);
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

  const totalRoutineCount = plans.reduce((count, plan) => count + plan.routineItems.length, 0);
  const activeRoutineCount = plans.reduce((count, plan) => count + plan.activeRoutineCount, 0);
  const progress = totalRoutineCount > 0
    ? Math.round((activeRoutineCount / totalRoutineCount) * 100)
    : 0;
  const firstActivePlan = plans.find((plan) => plan.status === 'active') ?? null;

  return (
    <AppTabScreen
      activeTab={primaryNavigation ? 'plans' : undefined}
      navigation={primaryNavigation}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <JourneyHeader companionId={companionId} experience={experience} />
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
          <View style={styles.questTitleRow}>
            <View style={styles.questTitleCopy}>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
                {t('list.title')}
              </Text>
              <Text style={[styles.headerDescription, { color: theme.colors.textMuted }]}>
                {t('list.progress', { active: activeRoutineCount, total: totalRoutineCount })}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t('list.createPlan')}
              accessibilityRole="button"
              onPress={onCreatePlan}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderBottomColor: theme.colors.focus,
                  opacity: pressed ? 0.72 : 1,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <MaterialIcons color={theme.colors.onPrimary} name="add" size={26} />
            </Pressable>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: palette.lightContainerHigh }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${progress}%` }]} />
          </View>
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
              onPress={() => firstActivePlan ? onAddRoutine(firstActivePlan) : onCreatePlan()}
              style={({ pressed }) => [
                styles.customRoutineButton,
                { backgroundColor: palette.lightContainerHigh, borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <MaterialIcons color={theme.colors.text} name="add-circle-outline" size={20} />
              <Text style={[styles.customRoutineLabel, { color: theme.colors.text }]}>
                {t('list.addCustomRoutine')}
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
                {
                  backgroundColor: theme.colors.primary,
                  borderBottomColor: theme.colors.focus,
                  opacity: pressed ? 0.72 : 1,
                },
                pressed && styles.buttonPressed,
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
  addButton: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  content: { flexGrow: 1, gap: spacing.md, paddingBottom: spacing.xxl, paddingHorizontal: spacing.md },
  header: { gap: spacing.sm },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.sm, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 0.6, lineHeight: typography.lineHeight.caption, textTransform: 'uppercase' },
  title: { fontFamily: typography.family.extraBold, fontSize: 24, lineHeight: 32 },
  headerDescription: { fontFamily: typography.family.body, fontSize: 13, lineHeight: 18 },
  questTitleCopy: { flex: 1, gap: 2 },
  questTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  stateContainer: { alignItems: 'center', gap: spacing.sm, justifyContent: 'center', minHeight: 180, padding: spacing.lg },
  stateText: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
  description: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  planList: { gap: spacing.md },
  planCard: { backgroundColor: palette.transparent, borderWidth: 0, gap: spacing.sm, padding: 0 },
  planCopy: { flex: 1, gap: spacing.xs },
  planTitle: { fontSize: typography.size.heading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.heading },
  routineCount: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  statusBadge: { borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  statusLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  routineRow: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', minHeight: touchTarget.minimum * 1.55, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  routineMarker: { borderRadius: 2, borderWidth: 1, height: 14, width: 14 },
  routineIcon: { alignItems: 'center', borderRadius: radii.sm, height: 42, justifyContent: 'center', width: 42 },
  routineText: { flex: 1, minWidth: 0 },
  routineTitle: { fontFamily: typography.family.bold, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  routineStatus: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  planActions: { display: 'none' },
  hiddenPlanMeta: { display: 'none' },
  moreButton: { alignItems: 'center', height: touchTarget.minimum, justifyContent: 'center', width: touchTarget.minimum },
  addRoutineButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.sm, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  addRoutineButtonLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  archiveConfirmation: { borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  archiveConfirmationTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  archiveConfirmationDescription: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  archiveActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  archiveConfirmButton: { alignItems: 'center', borderRadius: radii.sm, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  archiveConfirmLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  archiveError: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  primaryButton: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.sm, justifyContent: 'center', minHeight: touchTarget.minimum * 1.15, paddingHorizontal: spacing.lg },
  primaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  progressTrack: { borderRadius: radii.pill, height: 14, overflow: 'hidden' },
  customRoutineButton: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 58 },
  customRoutineLabel: { fontFamily: typography.family.bold, fontSize: 16, lineHeight: 22 },
  secondaryButton: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.lg },
  secondaryButtonLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
