import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { type ComponentProps, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { TodayRoutineItem } from '@/features/check-ins/domain/todayRoutines';
import { getCompanionAsset, type CompanionId } from '@/features/companion/domain/companions';
import {
  getJourneySceneColors,
  JourneyLandscape,
  type JourneyScene,
} from '@/features/check-ins/JourneyLandscape';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radii, spacing, touchTarget, typography } from '@/theme/tokens';

type TodayJourneyMapProps = {
  companionId: CompanionId;
  isLandscapeBackgroundShared?: boolean;
  isReadOnly: boolean;
  items: TodayRoutineItem[];
  mutatingRoutineIds: ReadonlySet<string>;
  nextRoutineId: string | null;
  onStartRoutine: (item: TodayRoutineItem) => void;
  onToggleRoutine: (item: TodayRoutineItem) => void;
  scene: JourneyScene;
};

export function TodayJourneyMap({
  companionId,
  isLandscapeBackgroundShared = false,
  isReadOnly,
  items,
  mutatingRoutineIds,
  nextRoutineId,
  onStartRoutine,
  onToggleRoutine,
  scene,
}: TodayJourneyMapProps) {
  const { t } = useTranslation('today');
  const { theme } = useTheme();
  const colors = getJourneySceneColors(scene);
  const currentIndex = items.findIndex((item) => item.id === nextRoutineId);
  const focusedIndex = currentIndex >= 0 ? currentIndex : Math.max(0, items.length - 1);
  const firstVisibleIndex = Math.max(0, Math.min(focusedIndex - 1, items.length - 3));
  const visibleItems = items.slice(firstVisibleIndex, firstVisibleIndex + 3);
  const [pendingUndoItem, setPendingUndoItem] = useState<TodayRoutineItem | null>(null);

  function requestUndo(item: TodayRoutineItem) {
    setPendingUndoItem(item);
  }

  function confirmUndo() {
    if (!pendingUndoItem) {
      return;
    }

    const itemToUndo = pendingUndoItem;

    setPendingUndoItem(null);
    onToggleRoutine(itemToUndo);
  }

  return (
    <View style={[styles.map, !isLandscapeBackgroundShared && { backgroundColor: colors.sky }]}>
      {!isLandscapeBackgroundShared ? <JourneyLandscape scene={scene} /> : null}
      <View style={[styles.path, { borderColor: colors.path }]} />
      {visibleItems.map((item, visibleIndex) => {
        const index = firstVisibleIndex + visibleIndex;
        const isComplete = item.completedAt !== null;
        const isCurrent = item.id === nextRoutineId;
        const isMutating = mutatingRoutineIds.has(item.id);
        const nodeSize = isCurrent ? 80 : 64;
        const horizontalOffset = index % 2 === 0 ? -52 : 52;
        const accessibilityLabel = isComplete
          ? t('undoItem', { title: item.title })
          : t('startItem', { title: item.title });

        return (
          <View
            key={item.id}
            style={[styles.step, { transform: [{ translateX: horizontalOffset }] }]}
          >
            {isCurrent ? (
              <Image
                accessibilityElementsHidden
                contentFit="contain"
                source={getCompanionAsset(companionId)}
                style={styles.companion}
              />
            ) : null}
            <Pressable
              accessibilityLabel={accessibilityLabel}
              accessibilityRole={isComplete ? 'checkbox' : 'button'}
              accessibilityState={{
                busy: isMutating,
                checked: isComplete ? true : undefined,
                disabled: isReadOnly || isMutating,
              }}
              disabled={isReadOnly || isMutating}
              onPress={() => {
                if (isComplete) {
                  requestUndo(item);
                } else {
                  onStartRoutine(item);
                }
              }}
              style={({ pressed }) => [
                styles.node,
                {
                  backgroundColor: isComplete || isCurrent
                    ? theme.colors.primary
                    : colors.node,
                  borderColor: isComplete || isCurrent
                    ? theme.colors.focus
                    : colors.nodeBorder,
                  height: nodeSize,
                  opacity: pressed || isMutating ? 0.68 : isComplete ? 0.72 : 1,
                  width: nodeSize,
                },
                pressed ? styles.nodePressed : undefined,
              ]}
            >
              <MaterialIcons
                color={isComplete || isCurrent ? theme.colors.onPrimary : colors.text}
                name={isComplete ? 'check' : getRoutineIcon(item.title)}
                size={isCurrent ? 38 : 30}
              />
            </Pressable>
            <View
              style={[
                styles.label,
                {
                  backgroundColor: colors.label,
                  borderColor: isCurrent ? theme.colors.focus : colors.labelBorder,
                },
                isCurrent && styles.currentLabel,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.labelText,
                  {
                    color: colors.text,
                    textDecorationLine: isComplete ? 'line-through' : 'none',
                  },
                ]}
              >
                {item.title}
              </Text>
            </View>
          </View>
        );
      })}
      <Modal
        animationType="fade"
        onRequestClose={() => setPendingUndoItem(null)}
        transparent
        visible={pendingUndoItem !== null}
      >
        <View style={styles.modalOverlay}>
          <View
            accessibilityViewIsModal
            style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <View style={[styles.modalIcon, { backgroundColor: palette.lightAccentSoft }]}>
              <MaterialIcons color={palette.lightAccentDark} name="undo" size={25} />
            </View>
            <Text accessibilityRole="header" style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('undoConfirmation.title')}
            </Text>
            <Text style={[styles.modalDescription, { color: theme.colors.textMuted }]}>
              {pendingUndoItem
                ? t('undoConfirmation.description', { title: pendingUndoItem.title })
                : null}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPendingUndoItem(null)}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalCancelButton,
                  { borderColor: theme.colors.border },
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.modalButtonLabel, { color: theme.colors.text }]}>
                  {t('undoConfirmation.cancel')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmUndo}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalConfirmButton,
                  { backgroundColor: palette.errorContainer, borderColor: palette.error },
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.modalButtonLabel, { color: palette.error }]}>
                  {t('undoConfirmation.confirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getRoutineIcon(title: string): ComponentProps<typeof MaterialIcons>['name'] {
  const normalizedTitle = title.toLocaleLowerCase();

  if (normalizedTitle.includes('water') || normalizedTitle.includes('물')) return 'water-drop';
  if (
    normalizedTitle.includes('read')
    || normalizedTitle.includes('book')
    || normalizedTitle.includes('독서')
    || normalizedTitle.includes('책')
    || normalizedTitle.includes('읽')
  ) return 'menu-book';
  if (normalizedTitle.includes('run') || normalizedTitle.includes('jog') || normalizedTitle.includes('달리')) return 'directions-run';
  if (normalizedTitle.includes('stretch') || normalizedTitle.includes('yoga') || normalizedTitle.includes('명상')) return 'self-improvement';

  return 'flag';
}

const styles = StyleSheet.create({
  companion: { height: 84, position: 'absolute', top: -76, width: 84, zIndex: 2 },
  currentLabel: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 4 },
  label: { borderRadius: radii.pill, borderWidth: 1, bottom: -32, maxWidth: 180, paddingHorizontal: spacing.sm, paddingVertical: 3, position: 'absolute' },
  labelText: { fontFamily: typography.family.bold, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  map: { alignItems: 'center', borderRadius: radii.xl, gap: 48, minHeight: 556, overflow: 'hidden', paddingBottom: 78, paddingTop: 108, position: 'relative' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  modalButton: { alignItems: 'center', borderBottomWidth: 3, borderRadius: radii.md, borderWidth: 2, flex: 1, justifyContent: 'center', minHeight: touchTarget.minimum, paddingHorizontal: spacing.sm },
  modalButtonLabel: { fontFamily: typography.family.bold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  modalCancelButton: { backgroundColor: palette.transparent },
  modalCard: { alignItems: 'center', borderBottomWidth: 4, borderRadius: radii.lg, borderWidth: 2, gap: spacing.md, maxWidth: 360, padding: spacing.lg, shadowColor: palette.lightText, shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.22, shadowRadius: 20, width: '100%', elevation: 10 },
  modalConfirmButton: { borderBottomWidth: 3 },
  modalDescription: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  modalIcon: { alignItems: 'center', borderRadius: radii.pill, height: 52, justifyContent: 'center', width: 52 },
  modalOverlay: { alignItems: 'center', backgroundColor: palette.scrim, flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalTitle: { fontFamily: typography.family.extraBold, fontSize: 21, lineHeight: 28, textAlign: 'center' },
  node: { alignItems: 'center', borderRadius: radii.pill, borderWidth: 3, justifyContent: 'center', overflow: 'hidden' },
  nodePressed: { opacity: 0.84, transform: [{ scale: 0.96 }] },
  path: { borderLeftWidth: 4, borderStyle: 'dashed', bottom: 76, left: '50%', opacity: 0.82, position: 'absolute', top: 96, zIndex: 1 },
  step: { alignItems: 'center', justifyContent: 'center', minHeight: 92, position: 'relative', width: 180, zIndex: 1 },
});
