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
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ canAskAgain: true, granted: false }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ canAskAgain: true, granted: false }),
  ),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
}));
