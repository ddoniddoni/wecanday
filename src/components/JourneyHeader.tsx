import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { getCompanionAsset, type CompanionId } from '@/features/companion/domain/companions';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

type JourneyHeaderProps = {
  companionId: CompanionId;
  experience: number;
  level?: number;
};

export function JourneyHeader({ companionId, experience, level }: JourneyHeaderProps) {
  const { t } = useTranslation('common');
  const { theme } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={[styles.avatar, { borderColor: theme.colors.focus }]}>
          <Image
            accessibilityLabel={t('journey.companionLabel')}
            accessibilityRole="image"
            contentFit="contain"
            source={getCompanionAsset(companionId)}
            style={styles.avatarImage}
          />
          {level !== undefined ? (
            <View style={[styles.levelBadge, { backgroundColor: theme.colors.accent }]}>
              <Text style={styles.levelLabel}>{t('journey.level', { level })}</Text>
            </View>
          ) : null}
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t('journey.title')}
        </Text>
      </View>
      <View
        style={[
          styles.experienceBadge,
          { backgroundColor: palette.lightContainerHigh, borderColor: theme.colors.border },
        ]}
      >
        <MaterialIcons color={theme.colors.primary} name="local-fire-department" size={22} />
        <Text style={[styles.experienceLabel, { color: theme.colors.primary }]}>
          {t('journey.experience', { count: experience })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: radii.pill, borderWidth: 2, height: 42, position: 'relative', width: 42 },
  avatarImage: { height: '100%', width: '100%' },
  brand: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm },
  experienceBadge: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 2, flexDirection: 'row', gap: spacing.xs, minHeight: touchTarget.minimum, paddingHorizontal: spacing.sm },
  experienceLabel: { fontFamily: typography.family.bold, fontSize: 14, lineHeight: 20 },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', minHeight: 64 },
  levelBadge: { borderRadius: radii.pill, bottom: -2, position: 'absolute', right: -5 },
  levelLabel: { color: palette.lightText, fontFamily: typography.family.bold, fontSize: 8, lineHeight: 12, paddingHorizontal: 3 },
  title: { flexShrink: 1, fontFamily: typography.family.extraBold, fontSize: 24, letterSpacing: -0.4, lineHeight: 28 },
});
