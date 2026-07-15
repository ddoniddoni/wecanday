import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { AppTabScreen } from '@/components/AppTabScreen';
import type { PrimaryNavigationActions } from '@/components/PrimaryNavigation';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';

type CommunityPlaceholderScreenProps = {
  primaryNavigation: PrimaryNavigationActions;
};

export function CommunityPlaceholderScreen({
  primaryNavigation,
}: CommunityPlaceholderScreenProps) {
  const { t } = useTranslation('community');
  const { theme } = useTheme();

  return (
    <AppTabScreen activeTab="community" navigation={primaryNavigation}>
      <View style={styles.content}>
        <View
          accessibilityLabel={t('accessibilityLabel')}
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: theme.colors.accent }]} />
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{t('eyebrow')}</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
            {t('title')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            {t('description')}
          </Text>
        </View>
      </View>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.xl },
  icon: { borderRadius: radii.pill, height: 52, width: 52 },
  eyebrow: { fontSize: typography.size.caption, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.caption },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
});
