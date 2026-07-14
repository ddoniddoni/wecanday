import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

export type PrimaryNavigationTab = 'plans' | 'profile' | 'statistics' | 'today';

type PrimaryNavigationProps = {
  activeTab: PrimaryNavigationTab;
  onOpenPlans: () => void;
  onOpenProfile: () => void;
  onOpenStatistics: () => void;
  onOpenToday: () => void;
};

export type PrimaryNavigationActions = Omit<PrimaryNavigationProps, 'activeTab'>;

function TabIcon({ color, tab }: { color: string; tab: PrimaryNavigationTab }) {
  if (tab === 'today') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.homeRoof, { borderColor: color }]} />
        <View style={[styles.homeBody, { borderColor: color }]} />
      </View>
    );
  }

  if (tab === 'plans') {
    return (
      <View style={[styles.documentIcon, { borderColor: color }]}>
        <View style={[styles.documentLine, { backgroundColor: color }]} />
        <View style={[styles.documentLine, styles.documentLineShort, { backgroundColor: color }]} />
      </View>
    );
  }

  if (tab === 'statistics') {
    return (
      <View style={styles.chartIcon}>
        <View style={[styles.chartBar, styles.chartBarShort, { backgroundColor: color }]} />
        <View style={[styles.chartBar, styles.chartBarMedium, { backgroundColor: color }]} />
        <View style={[styles.chartBar, styles.chartBarTall, { backgroundColor: color }]} />
      </View>
    );
  }

  return <ProfileIcon color={color} />;
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={styles.profileIcon}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileShoulders, { borderColor: color }]} />
    </View>
  );
}

export function PrimaryNavigation({
  activeTab,
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
    { onPress: onOpenStatistics, tab: 'statistics' },
    { onPress: onOpenProfile, tab: 'profile' },
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {tabs.map(({ onPress, tab }) => {
        const isActive = activeTab === tab;
        const color = isActive ? theme.colors.primary : theme.colors.textMuted;
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
                backgroundColor: isActive
                  ? theme.colors.background
                  : theme.colors.surface,
                borderColor: isActive ? theme.colors.border : theme.colors.surface,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <TabIcon color={color} tab={tab} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: radii.xl,
    borderWidth: 1,
    elevation: 4,
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    padding: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 52,
  },
  tabLabel: { fontSize: 11, fontWeight: typography.weight.bold, lineHeight: 14 },
  iconBox: { alignItems: 'center', height: 20, justifyContent: 'flex-end', width: 22 },
  homeRoof: { borderLeftWidth: 2, borderTopWidth: 2, height: 12, transform: [{ rotate: '45deg' }], width: 12 },
  homeBody: { borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, bottom: 0, height: 11, position: 'absolute', width: 14 },
  documentIcon: { borderRadius: 3, borderWidth: 2, gap: 3, height: 20, justifyContent: 'center', paddingHorizontal: 3, width: 15 },
  documentLine: { borderRadius: 2, height: 2, width: '100%' },
  documentLineShort: { width: '65%' },
  chartIcon: { alignItems: 'flex-end', flexDirection: 'row', gap: 2, height: 20, width: 20 },
  chartBar: { borderRadius: 2, width: 5 },
  chartBarShort: { height: 7 },
  chartBarMedium: { height: 12 },
  chartBarTall: { height: 18 },
  profileIcon: { height: 20, position: 'relative', width: 20 },
  profileHead: { borderRadius: radii.pill, borderWidth: 2, height: 8, left: 6, position: 'absolute', top: 1, width: 8 },
  profileShoulders: { borderBottomWidth: 0, borderTopLeftRadius: radii.pill, borderTopRightRadius: radii.pill, borderWidth: 2, height: 9, left: 3, position: 'absolute', top: 11, width: 14 },
});
