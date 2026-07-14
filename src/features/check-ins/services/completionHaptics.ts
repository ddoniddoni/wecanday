import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type RoutineCompletionHapticOptions = {
  isEnabled?: boolean;
  shouldReduceMotion?: boolean;
};

export async function playRoutineCompletionHaptic({
  isEnabled = true,
  shouldReduceMotion = false,
}: RoutineCompletionHapticOptions = {}): Promise<void> {
  if (!isEnabled || shouldReduceMotion) {
    return;
  }

  try {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptic feedback is optional; it must never block a completed check-in.
  }
}
