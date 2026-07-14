import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getRoutineDayRange } from '@/features/check-ins/domain/todayRoutines';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

type TodayDateStripProps = {
  onSelectRoutineDay: (routineDay: string) => void;
  routineDay: string;
  todayRoutineDay: string;
};

type DateFormatters = {
  dayOfMonth: Intl.DateTimeFormat;
  fullDate: Intl.DateTimeFormat;
  weekday: Intl.DateTimeFormat;
};

const formattersByLocale = new Map<string, DateFormatters>();

export function TodayDateStrip({
  onSelectRoutineDay,
  routineDay,
  todayRoutineDay,
}: TodayDateStripProps) {
  const { i18n, t } = useTranslation('today');
  const { theme } = useTheme();
  const routineDays = getRoutineDayRange(routineDay);
  const formatters = getDateFormatters(i18n.language);

  return (
    <View
      accessibilityLabel={t('dateSelector.accessibilityLabel')}
      style={[styles.container, { borderColor: theme.colors.border }]}
    >
      {routineDays.map((day) => {
        const isSelected = day === routineDay;
        const isToday = day === todayRoutineDay;
        const date = toUtcDate(day);
        const weekday = formatters.weekday.format(date);
        const dayOfMonth = formatters.dayOfMonth.format(date);

        return (
          <Pressable
            accessibilityLabel={t('dateSelector.selectDay', {
              date: formatters.fullDate.format(date),
              today: isToday ? t('dateSelector.todaySuffix') : '',
            })}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={day}
            onPress={() => onSelectRoutineDay(day)}
            style={({ pressed }) => [
              styles.day,
              {
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.weekday, { color: isSelected ? theme.colors.onPrimary : theme.colors.textMuted }]}
            >
              {weekday}
            </Text>
            <Text style={[styles.dayOfMonth, { color: isSelected ? theme.colors.onPrimary : theme.colors.text }]}>
              {dayOfMonth}
            </Text>
            <View
              style={[
                styles.todayMarker,
                { backgroundColor: isToday ? (isSelected ? theme.colors.accent : theme.colors.primary) : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function toUtcDate(routineDay: string): Date {
  const [year, month, day] = routineDay.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12));
}

function getDateFormatters(locale: string): DateFormatters {
  const cachedFormatters = formattersByLocale.get(locale);

  if (cachedFormatters) {
    return cachedFormatters;
  }

  const nextFormatters = {
    dayOfMonth: new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' }),
    fullDate: new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
    }),
    weekday: new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'short' }),
  };

  formattersByLocale.set(locale, nextFormatters);
  return nextFormatters;
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  day: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: touchTarget.minimum + spacing.sm,
    minWidth: touchTarget.minimum,
    paddingHorizontal: 2,
    paddingVertical: spacing.xs,
  },
  dayOfMonth: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  todayMarker: { borderRadius: radii.pill, height: 4, width: 4 },
  weekday: { fontSize: 11, fontWeight: typography.weight.medium, lineHeight: 14 },
});
