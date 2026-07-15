import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { AppTabScreen } from '@/components/AppTabScreen';
import type { PrimaryNavigationActions } from '@/components/PrimaryNavigation';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, typography } from '@/theme/tokens';

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
          <View style={[styles.icon, { backgroundColor: palette.lightContainerHigh }]}>
            <MaterialIcons color={theme.colors.focus} name="forum" size={30} />
          </View>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>{t('eyebrow')}</Text>
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
  card: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.lg, borderWidth: 2, gap: spacing.md, padding: spacing.xl },
  icon: { alignItems: 'center', borderRadius: radii.pill, height: 58, justifyContent: 'center', width: 58 },
  eyebrow: { fontFamily: typography.family.bold, fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  title: { fontFamily: typography.family.extraBold, fontSize: typography.size.title, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  description: { fontFamily: typography.family.body, fontSize: typography.size.body, lineHeight: typography.lineHeight.body, textAlign: 'center' },
});
