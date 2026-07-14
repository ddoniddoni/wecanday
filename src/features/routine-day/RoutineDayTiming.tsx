import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import {
  formatRoutineDayEndTime,
  getMillisecondsUntilNextMinute,
  getRoutineDayTiming,
  systemClock,
  type Clock,
  type RoutineDayConfig,
} from '@/features/routine-day/domain/routineDay';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type RoutineDayTimingProps = {
  clock?: Clock;
  config: RoutineDayConfig;
  variant?: 'card' | 'inline';
};

export function RoutineDayTiming({
  clock = systemClock,
  config,
  variant = 'card',
}: RoutineDayTimingProps) {
  const { i18n, t } = useTranslation('today');
  const { theme } = useTheme();
  const [now, setNow] = useState(() => clock.now());
  const timing = getRoutineDayTiming(now, config);
  const endTime = formatRoutineDayEndTime(
    timing.endsAt,
    i18n.language,
    config.timeZone,
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function scheduleNextMinute() {
      const nextNow = clock.now();

      timeoutId = setTimeout(() => {
        setNow(clock.now());
        scheduleNextMinute();
      }, getMillisecondsUntilNextMinute(nextNow));
    }

    scheduleNextMinute();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [clock]);

  if (variant === 'inline') {
    return (
      <View accessibilityLabel={t('routineTiming.accessibilityLabel', {
        endTime,
        hours: timing.remainingHours,
        minutes: timing.remainingMinutes,
      })} style={styles.inline}>
        <Text style={[styles.inlineLabel, { color: theme.colors.textMuted }]}>
          {t('routineTiming.remaining', {
            hours: timing.remainingHours,
            minutes: timing.remainingMinutes,
          })}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={t('routineTiming.accessibilityLabel', {
        endTime,
        hours: timing.remainingHours,
        minutes: timing.remainingMinutes,
      })}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {t('routineTiming.endLabel')}
        </Text>
        <Text style={[styles.endTime, { color: theme.colors.text }]}>{endTime}</Text>
      </View>
      <Text style={[styles.remaining, { color: theme.colors.primary }]}>
        {t('routineTiming.remaining', {
          hours: timing.remainingHours,
          minutes: timing.remainingMinutes,
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  copy: { gap: spacing.xs },
  label: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  endTime: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
  inline: { flex: 1 },
  inlineLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.caption },
  remaining: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.body,
  },
});
