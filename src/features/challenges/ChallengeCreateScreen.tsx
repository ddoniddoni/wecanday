import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getChallengeErrorCode,
  type ChallengeErrorCode,
} from '@/features/challenges/domain/challengeErrors';
import { getDefaultChallengeEndsOn } from '@/features/challenges/domain/challengeInput';
import { createOneToOneChallenge } from '@/features/challenges/services/challengeService';
import { loadFriendConnections } from '@/features/friends/services/friendConnectionService';
import type { Database, FriendConnectionRow } from '@/lib/supabase/database.types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, touchTarget, typography } from '@/theme/tokens';

const WEEKDAYS = [
  { key: 'sunday', value: 0 },
  { key: 'monday', value: 1 },
  { key: 'tuesday', value: 2 },
  { key: 'wednesday', value: 3 },
  { key: 'thursday', value: 4 },
  { key: 'friday', value: 5 },
  { key: 'saturday', value: 6 },
] as const;

const ALL_WEEKDAYS = WEEKDAYS.map(({ value }) => value);

type ChallengeCreateScreenProps = {
  client: SupabaseClient<Database>;
  initialStartsOn: string;
  onBack: () => void;
  onComplete: () => void;
};

export function ChallengeCreateScreen({
  client,
  initialStartsOn,
  onBack,
  onComplete,
}: ChallengeCreateScreenProps) {
  const { t } = useTranslation('challenges');
  const { theme } = useTheme();
  const [friends, setFriends] = useState<FriendConnectionRow[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [startsOn, setStartsOn] = useState(initialStartsOn);
  const [endsOn, setEndsOn] = useState(() => getDefaultChallengeEndsOn(initialStartsOn));
  const [scheduleWeekdays, setScheduleWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorCode, setErrorCode] = useState<ChallengeErrorCode | null>(null);

  const loadFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    setErrorCode(null);
    try {
      const connections = await loadFriendConnections(client);
      setFriends(connections.friends);
    } catch {
      setErrorCode('CHALLENGE_LOAD_FAILED');
    } finally {
      setIsLoadingFriends(false);
    }
  }, [client]);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void loadFriends();
    }, 0);

    return () => clearTimeout(initialLoad);
  }, [loadFriends]);

  function toggleWeekday(weekday: number) {
    setScheduleWeekdays((selectedWeekdays) =>
      selectedWeekdays.includes(weekday)
        ? selectedWeekdays.filter((value) => value !== weekday)
        : [...selectedWeekdays, weekday].sort((left, right) => left - right),
    );
  }

  async function handleSave() {
    if (!selectedFriendId) {
      setErrorCode('INVALID_CHALLENGE_INPUT');
      return;
    }

    setErrorCode(null);
    setIsSaving(true);
    try {
      await createOneToOneChallenge(client, {
        endsOn,
        friendId: selectedFriendId,
        scheduleWeekdays,
        startsOn,
        title,
      });
      onComplete();
    } catch (error) {
      setErrorCode(getChallengeErrorCode(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel={t('create.back')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, { borderColor: theme.colors.border, opacity: pressed ? 0.72 : 1 }]}
        >
          <Text style={[styles.backLabel, { color: theme.colors.text }]}>{t('create.back')}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{t('create.title')}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{t('create.description')}</Text>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('create.friendLabel')}</Text>
          {isLoadingFriends ? (
            <ActivityIndicator accessibilityLabel={t('create.loadingFriends')} color={theme.colors.primary} />
          ) : friends.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{t('create.emptyFriends')}</Text>
          ) : (
            friends.map((friend) => {
              const isSelected = selectedFriendId === friend.id;
              return (
                <Pressable
                  accessibilityLabel={t('create.selectFriendAccessibilityLabel', { displayName: friend.display_name })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  key={friend.id}
                  onPress={() => setSelectedFriendId(friend.id)}
                  style={({ pressed }) => [
                    styles.friendButton,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.friendName, { color: isSelected ? theme.colors.onPrimary : theme.colors.text }]}>{friend.display_name}</Text>
                </Pressable>
              );
            })
          )}
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('create.titleLabel')}</Text>
          <TextInput
            accessibilityLabel={t('create.titleLabel')}
            editable={!isSaving}
            maxLength={80}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={title}
          />
        </View>
        <View style={styles.dateRow}>
          <DateField label={t('create.startsOnLabel')} onChangeText={setStartsOn} value={startsOn} />
          <DateField label={t('create.endsOnLabel')} onChangeText={setEndsOn} value={endsOn} />
        </View>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{t('create.dateHint')}</Text>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('create.scheduleLabel')}</Text>
          <View style={styles.weekdayList}>
            {WEEKDAYS.map((weekday) => {
              const isSelected = scheduleWeekdays.includes(weekday.value);
              return (
                <Pressable
                  accessibilityLabel={t(`weekdays.${weekday.key}`)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  key={weekday.key}
                  onPress={() => toggleWeekday(weekday.value)}
                  style={({ pressed }) => [styles.weekdayButton, { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface, borderColor: isSelected ? theme.colors.primary : theme.colors.border, opacity: pressed ? 0.72 : 1 }]}
                >
                  <Text style={[styles.weekdayLabel, { color: isSelected ? theme.colors.onPrimary : theme.colors.text }]}>{t(`weekdays.${weekday.key}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {errorCode ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.text }]}>{t(`errors.${errorCode}`)}</Text> : null}
        <Pressable
          accessibilityLabel={t('create.submit')}
          accessibilityRole="button"
          disabled={isSaving || isLoadingFriends}
          onPress={() => void handleSave()}
          style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.colors.primary, opacity: pressed || isSaving || isLoadingFriends ? 0.72 : 1 }]}
        >
          {isSaving ? <ActivityIndicator accessibilityLabel={t('create.saving')} color={theme.colors.onPrimary} /> : <Text style={[styles.saveLabel, { color: theme.colors.onPrimary }]}>{t('create.submit')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DateField({ label, onChangeText, value }: { label: string; onChangeText: (value: string) => void; value: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.dateField}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  backLabel: { fontSize: typography.size.body, fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.body },
  content: { gap: spacing.md, padding: spacing.md },
  dateField: { flex: 1, gap: spacing.xs },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  description: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  empty: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  error: { fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
  fieldGroup: { gap: spacing.sm },
  friendButton: { borderRadius: radii.md, borderWidth: 1, minHeight: touchTarget.minimum, justifyContent: 'center', paddingHorizontal: spacing.md },
  friendName: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  hint: { fontSize: typography.size.caption, lineHeight: typography.lineHeight.caption },
  input: { borderRadius: radii.sm, borderWidth: 1, fontSize: typography.size.body, lineHeight: typography.lineHeight.body, minHeight: touchTarget.minimum, paddingHorizontal: spacing.sm },
  label: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  saveButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.md },
  saveLabel: { fontSize: typography.size.body, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  screen: { flex: 1 },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title },
  weekdayButton: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: touchTarget.minimum, minWidth: touchTarget.minimum, paddingHorizontal: spacing.sm },
  weekdayLabel: { fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  weekdayList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
