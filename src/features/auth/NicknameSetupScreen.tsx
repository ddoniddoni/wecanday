import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCompanionAsset } from '@/features/companion/domain/companions';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

const MAX_DISPLAY_NAME_LENGTH = 30;

type NicknameSetupScreenProps = {
  initialDisplayName: string;
  onBack: () => void;
  onSave: (displayName: string) => Promise<void>;
};

export function NicknameSetupScreen({
  initialDisplayName,
  onBack,
  onSave,
}: NicknameSetupScreenProps) {
  const { t } = useTranslation('auth');
  const { theme } = useTheme();
  const [nickname, setNickname] = useState(initialDisplayName);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const normalizedNickname = nickname.trim();
  const isValid = normalizedNickname.length > 0 && normalizedNickname.length <= MAX_DISPLAY_NAME_LENGTH;

  async function handleSave() {
    if (!isValid) {
      setHasSaveError(true);
      return;
    }

    setHasSaveError(false);
    setIsSaving(true);

    try {
      await onSave(normalizedNickname);
    } catch {
      setHasSaveError(true);
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t('nicknameSetup.back')}
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, { opacity: pressed || isSaving ? 0.6 : 1 }]}
        >
          <MaterialIcons color={theme.colors.text} name="arrow-back-ios-new" size={20} />
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Image
          accessibilityLabel={t('nicknameSetup.imageAccessibilityLabel')}
          accessibilityRole="image"
          contentFit="contain"
          source={getCompanionAsset('sprout')}
          style={styles.image}
        />
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
          {t('nicknameSetup.title')}
        </Text>
        <TextInput
          accessibilityLabel={t('nicknameSetup.inputLabel')}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isSaving}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          onChangeText={(value) => {
            setNickname(value);
            setHasSaveError(false);
          }}
          placeholder={t('nicknameSetup.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: hasSaveError ? theme.colors.accent : theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          value={nickname}
        />
        {hasSaveError ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>
            {isValid ? t('nicknameSetup.saveError') : t('nicknameSetup.validationError')}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid || isSaving }}
          disabled={!isValid || isSaving}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: theme.colors.primary,
              borderBottomColor: theme.colors.focus,
              opacity: !isValid || isSaving ? 0.45 : pressed ? 0.72 : 1,
            },
            pressed && isValid && !isSaving && styles.continueButtonPressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator accessibilityLabel={t('nicknameSetup.saving')} color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.continueLabel, { color: theme.colors.onPrimary }]}>
              {t('nicknameSetup.continue')}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: touchTarget.minimum, minWidth: touchTarget.minimum },
  progressTrack: { borderRadius: radii.pill, flex: 1, height: 8, overflow: 'hidden' },
  progressFill: { borderRadius: radii.pill, height: '100%', width: '34%' },
  content: { alignItems: 'center', flex: 1, gap: spacing.lg, justifyContent: 'center', paddingHorizontal: spacing.lg },
  image: { height: 96, width: 128 },
  title: { fontFamily: typography.family.extraBold, fontSize: typography.size.title, lineHeight: typography.lineHeight.title, textAlign: 'center' },
  input: { borderRadius: radii.sm, borderWidth: 2, fontFamily: typography.family.body, fontSize: typography.size.body, minHeight: 56, paddingHorizontal: spacing.md, textAlign: 'center', width: '100%' },
  error: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption, textAlign: 'center' },
  footer: { padding: spacing.md },
  continueButton: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.sm, justifyContent: 'center', minHeight: 56, paddingHorizontal: spacing.lg },
  continueButtonPressed: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  continueLabel: { fontFamily: typography.family.bold, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
});
