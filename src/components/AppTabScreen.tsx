import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PrimaryNavigation,
  type PrimaryNavigationActions,
  type PrimaryNavigationTab,
} from '@/components/PrimaryNavigation';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type AppTabScreenProps = PropsWithChildren<{
  activeTab?: PrimaryNavigationTab;
  navigation?: PrimaryNavigationActions;
}>;

export function AppTabScreen({
  activeTab,
  children,
  navigation,
}: AppTabScreenProps) {
  const { theme } = useTheme();
  const shouldShowNavigation = activeTab !== undefined && navigation !== undefined;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.content}>
        {children}
      </SafeAreaView>
      {shouldShowNavigation ? (
        <SafeAreaView edges={['bottom']} style={styles.navigationSafeArea}>
          <PrimaryNavigation activeTab={activeTab} {...navigation} />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  navigationSafeArea: { paddingBottom: spacing.xs, paddingTop: spacing.sm },
  screen: { flex: 1 },
});
