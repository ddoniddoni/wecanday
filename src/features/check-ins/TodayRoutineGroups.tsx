import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  TodayRoutineGroup,
  TodayRoutineItem,
} from '@/features/check-ins/domain/todayRoutines';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type TodayRoutineGroupsProps = {
  groups: TodayRoutineGroup[];
  isReadOnly: boolean;
  mutatingRoutineIds: ReadonlySet<string>;
  nextRoutineId: string | null;
  onEditRoutine: (item: TodayRoutineItem) => void;
  onStartRoutine: (item: TodayRoutineItem) => void;
  onToggleRoutine: (item: TodayRoutineItem) => void;
};

const timeFormattersByLocale = new Map<string, Intl.DateTimeFormat>();

export function TodayRoutineGroups({
  groups,
  isReadOnly,
  mutatingRoutineIds,
  nextRoutineId,
  onEditRoutine,
  onStartRoutine,
  onToggleRoutine,
}: TodayRoutineGroupsProps) {
  const { i18n, t } = useTranslation('today');
  const { theme } = useTheme();

  return (
    <View style={styles.list}>
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text accessibilityRole="header" style={[styles.groupTitle, { color: theme.colors.text }]}>
              {t(`timeGroups.${group.key}.title`)}
            </Text>
            <Text style={[styles.groupCount, { color: theme.colors.textMuted }]}>
              {t('timeGroups.count', { count: group.items.length })}
            </Text>
          </View>
          {group.items.map((item) => {
            const isComplete = item.completedAt !== null;
            const isMutating = mutatingRoutineIds.has(item.id);
            const isNext = item.id === nextRoutineId;
            const actionLabel = isComplete
              ? t('undoItem', { title: item.title })
              : t('completeItem', { title: item.title });

            return (
              <View
                key={item.id}
                style={[
                  styles.routine,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isNext ? theme.colors.primary : theme.colors.border,
                    opacity: isMutating || isReadOnly ? 0.68 : 1,
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel={isReadOnly ? t('reviewItem', { title: item.title }) : actionLabel}
                  accessibilityRole="checkbox"
                  accessibilityState={{ busy: isMutating, checked: isComplete, disabled: isReadOnly || isMutating }}
                  disabled={isReadOnly || isMutating}
                  onPress={() => onToggleRoutine(item)}
                  style={styles.completeButton}
                >
                  <View
                    style={[
                      styles.checkmark,
                      {
                        backgroundColor: isComplete ? theme.colors.primary : theme.colors.background,
                        borderColor: isComplete ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.checkmarkLabel, { color: isComplete ? theme.colors.onPrimary : theme.colors.textMuted }]}>
                      {isComplete ? '✓' : ''}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel={t('startItem', { title: item.title })}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isComplete || isReadOnly }}
                  disabled={isComplete || isReadOnly}
                  onPress={() => onStartRoutine(item)}
                  style={({ pressed }) => [styles.copy, { opacity: pressed || isComplete || isReadOnly ? 0.64 : 1 }]}
                >
                  {isNext ? (
                    <Text style={[styles.nextLabel, { color: theme.colors.primary }]}>
                      {t('nextRoutine')}
                    </Text>
                  ) : null}
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.title,
                      {
                        color: theme.colors.text,
                        textDecorationLine: isComplete ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                    {formatRoutineTime(item.reminder_minute, i18n.language, t('timeGroups.anytime.unscheduled'))}
                  </Text>
                  {item.syncStatus ? (
                    <Text style={[styles.syncLabel, { color: theme.colors.textMuted }]}>
                      {t(`sync.${item.syncStatus}`)}
                    </Text>
                  ) : null}
                </Pressable>
                <Pressable
                  accessibilityLabel={t('editItem', { title: item.title })}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isReadOnly }}
                  disabled={isReadOnly}
                  onPress={() => onEditRoutine(item)}
                  style={({ pressed }) => [
                    styles.editButton,
                    {
                      borderColor: theme.colors.border,
                      opacity: pressed || isReadOnly ? 0.56 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.editLabel, { color: theme.colors.text }]}>{t('edit')}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function formatRoutineTime(
  reminderMinute: number | null,
  locale: string,
  unscheduledLabel: string,
): string {
  if (reminderMinute === null) {
    return unscheduledLabel;
  }

  return getTimeFormatter(locale).format(new Date(Date.UTC(2026, 0, 1, 0, reminderMinute)));
}

function getTimeFormatter(locale: string): Intl.DateTimeFormat {
  const cachedFormatter = timeFormattersByLocale.get(locale);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  timeFormattersByLocale.set(locale, formatter);
  return formatter;
}

const styles = StyleSheet.create({
  checkmark: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, height: 28, justifyContent: 'center', width: 28 },
  checkmarkLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, includeFontPadding: false, lineHeight: 20 },
  completeButton: { alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', minHeight: touchTarget.minimum, minWidth: touchTarget.minimum },
  copy: { flex: 1, gap: 2, minWidth: 0, paddingVertical: spacing.sm },
  editButton: { alignItems: 'center', alignSelf: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, minWidth: touchTarget.minimum, paddingHorizontal: spacing.sm },
  editLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  group: { gap: spacing.sm },
  groupCount: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  groupHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  groupTitle: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  list: { gap: spacing.lg },
  meta: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  nextLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  routine: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 76, paddingEnd: spacing.sm },
  syncLabel: { fontSize: 11, lineHeight: 14 },
  title: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
});
