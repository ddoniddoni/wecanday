import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { playRoutineCompletionHaptic } from '@/features/check-ins/services/completionHaptics';

jest.mock('expo-haptics', () => ({
  AndroidHaptics: { Confirm: 'confirm' },
  NotificationFeedbackType: { Success: 'success' },
  notificationAsync: jest.fn(() => Promise.resolve()),
  performAndroidHapticsAsync: jest.fn(() => Promise.resolve()),
}));

describe('playRoutineCompletionHaptic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not vibrate when the user turns vibration feedback off', async () => {
    await playRoutineCompletionHaptic({ isEnabled: false });

    expect(Haptics.performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('uses the platform success pattern when enabled', async () => {
    await playRoutineCompletionHaptic({ isEnabled: true });

    if (Platform.OS === 'android') {
      expect(Haptics.performAndroidHapticsAsync).toHaveBeenCalledWith(
        Haptics.AndroidHaptics.Confirm,
      );
      return;
    }

    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });
});
