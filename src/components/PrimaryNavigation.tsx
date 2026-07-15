import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, typography } from '@/theme/tokens';

export type PrimaryNavigationTab = 'community' | 'plans' | 'profile' | 'statistics' | 'today';

type PrimaryNavigationProps = {
  activeTab: PrimaryNavigationTab;
  onOpenCommunity: () => void;
  onOpenPlans: () => void;
  onOpenProfile: () => void;
  onOpenStatistics: () => void;
  onOpenToday: () => void;
};

export type PrimaryNavigationActions = Omit<PrimaryNavigationProps, 'activeTab'>;

const iconNames: Record<PrimaryNavigationTab, ComponentProps<typeof MaterialIcons>['name']> = {
  community: 'forum',
  plans: 'calendar-today',
  profile: 'settings',
  statistics: 'bar-chart',
  today: 'home',
};

export function PrimaryNavigation({
  activeTab,
  onOpenCommunity,
  onOpenPlans,
  onOpenProfile,
  onOpenStatistics,
  onOpenToday,
}: PrimaryNavigationProps) {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const tabs: readonly { onPress: () => void; tab: PrimaryNavigationTab }[] = [
    { onPress: onOpenToday, tab: 'today' },
    { onPress: onOpenPlans, tab: 'plans' },
    { onPress: onOpenCommunity, tab: 'community' },
    { onPress: onOpenStatistics, tab: 'statistics' },
    { onPress: onOpenProfile, tab: 'profile' },
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {tabs.map(({ onPress, tab }) => {
        const isActive = activeTab === tab;
        const iconColor = isActive ? theme.colors.onPrimary : theme.colors.textMuted;
        const labelColor = isActive ? theme.colors.onPrimary : theme.colors.textMuted;
        const label = t(`navigation.${tab}`);

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: isActive ? theme.colors.primary : palette.transparent,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons color={iconColor} name={iconNames[tab]} size={22} />
            </View>
            <Text numberOfLines={1} style={[styles.tabLabel, { color: labelColor }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    marginHorizontal: 2,
    minHeight: 56,
  },
  iconContainer: { alignItems: 'center', height: 24, justifyContent: 'center', width: 28 },
  tabLabel: { fontFamily: typography.family.bold, fontSize: 10, lineHeight: 12, maxWidth: 62, textAlign: 'center' },
});
