import appConfig from '../../../app.json';

import { resources } from '@/i18n/resources';
import { resolveSupportedLocale, supportedLocales } from '@/i18n/types';

describe('i18n foundation', () => {
  it.each([
    ['ko-KR', 'ko'],
    ['en-US', 'en'],
    ['ja-JP', 'en'],
    [null, 'en'],
  ])('resolves %s to %s', (languageCode, expectedLocale) => {
    expect(resolveSupportedLocale(languageCode)).toBe(expectedLocale);
  });

  it('keeps Korean and English translation keys aligned', () => {
    expect(Object.keys(resources.ko.auth).sort()).toEqual(
      Object.keys(resources.en.auth).sort(),
    );
    expect(Object.keys(resources.ko.common).sort()).toEqual(
      Object.keys(resources.en.common).sort(),
    );
    expect(Object.keys(resources.ko.onboarding).sort()).toEqual(
      Object.keys(resources.en.onboarding).sort(),
    );
  });

  it('keeps native supported locales aligned with the app registry', () => {
    const localizationPlugin = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-localization',
    );

    if (!Array.isArray(localizationPlugin)) {
      throw new Error('expo-localization config plugin is required.');
    }

    const pluginOptions = localizationPlugin[1];

    if (
      typeof pluginOptions !== 'object' ||
      pluginOptions === null ||
      !('supportedLocales' in pluginOptions)
    ) {
      throw new Error('expo-localization supportedLocales are required.');
    }

    const nativeLocales = pluginOptions.supportedLocales;

    expect(nativeLocales.android).toEqual([...supportedLocales]);
    expect(nativeLocales.ios).toEqual([...supportedLocales]);
  });
});
