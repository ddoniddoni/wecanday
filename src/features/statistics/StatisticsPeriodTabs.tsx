import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

export type StatisticsPeriod = 'month' | 'week' | 'year';

type StatisticsPeriodTabsProps = {
  activePeriod: StatisticsPeriod;
  onSelectPeriod: (period: StatisticsPeriod) => void;
};

const periods: readonly StatisticsPeriod[] = ['week', 'month', 'year'];

export function StatisticsPeriodTabs({
  activePeriod,
  onSelectPeriod,
}: StatisticsPeriodTabsProps) {
  const { t } = useTranslation('statistics');
  const { theme } = useTheme();
  const activeColor = theme.colors.text;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark ? theme.colors.border : palette.lightContainerHigh,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {periods.map((period) => {
        const isActive = period === activePeriod;

        return (
          <Pressable
            accessibilityLabel={t(`period.${period}`)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            disabled={isActive}
            key={period}
            onPress={() => onSelectPeriod(period)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: isActive ? theme.colors.surface : palette.transparent,
                borderColor: isActive ? theme.colors.border : palette.transparent,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? activeColor : theme.colors.textMuted },
              ]}
            >
              {t(`period.${period}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  label: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
  },
});
