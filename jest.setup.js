/* global jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock');

  return {
    ...reanimated,
    useReducedMotion: () => false,
  };
});

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ canAskAgain: true, granted: false }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ canAskAgain: true, granted: false }),
  ),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
}));
