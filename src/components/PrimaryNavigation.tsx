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

function TabIcon({ color, tab }: { color: string; tab: PrimaryNavigationTab }) {
  if (tab === 'community') {
    return (
      <View style={styles.communityIcon}>
        <View style={[styles.communityBubble, styles.communityBubbleBack, { borderColor: color }]} />
        <View style={[styles.communityBubble, styles.communityBubbleFront, { borderColor: color }]} />
      </View>
    );
  }

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
      <View style={[styles.profileHead, { backgroundColor: color }]} />
      <View style={[styles.profileShoulders, { borderColor: color }]} />
    </View>
  );
}

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
        { backgroundColor: theme.colors.surface },
      ]}
    >
      {tabs.map(({ onPress, tab }) => {
        const isActive = activeTab === tab;
        const iconColor = isActive ? theme.colors.primary : theme.colors.textMuted;
        const labelColor = isActive ? theme.colors.primary : theme.colors.textMuted;
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
                backgroundColor: palette.transparent,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <TabIcon color={iconColor} tab={tab} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 56,
  },
  iconContainer: { alignItems: 'center', height: 24, justifyContent: 'center', width: 28 },
  tabLabel: { fontSize: 10, fontWeight: typography.weight.bold, lineHeight: 12, maxWidth: 62, textAlign: 'center' },
  iconBox: { alignItems: 'center', height: 20, justifyContent: 'flex-end', width: 22 },
  homeRoof: { borderLeftWidth: 2, borderTopWidth: 2, height: 12, transform: [{ rotate: '45deg' }], width: 12 },
  homeBody: { borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, bottom: 0, height: 11, position: 'absolute', width: 14 },
  documentIcon: { borderRadius: 3, borderWidth: 2, gap: 3, height: 20, justifyContent: 'center', paddingHorizontal: 3, width: 15 },
  documentLine: { borderRadius: 2, height: 2, width: '100%' },
  documentLineShort: { width: '65%' },
  communityIcon: { height: 20, position: 'relative', width: 22 },
  communityBubble: { borderRadius: radii.pill, borderWidth: 2, height: 12, position: 'absolute', width: 15 },
  communityBubbleBack: { left: 0, top: 1 },
  communityBubbleFront: { bottom: 0, right: 0 },
  chartIcon: { alignItems: 'flex-end', flexDirection: 'row', gap: 2, height: 20, width: 20 },
  chartBar: { borderRadius: 2, width: 5 },
  chartBarShort: { height: 7 },
  chartBarMedium: { height: 12 },
  chartBarTall: { height: 18 },
  profileIcon: { alignItems: 'center', height: 20, justifyContent: 'space-between', width: 20 },
  profileHead: { borderRadius: radii.pill, height: 8, width: 8 },
  profileShoulders: { borderLeftWidth: 2, borderRightWidth: 2, borderTopLeftRadius: radii.pill, borderTopRightRadius: radii.pill, borderTopWidth: 2, height: 9, width: 16 },
});
