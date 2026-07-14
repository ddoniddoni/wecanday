import appConfig from '../../../app.json';

import { i18n } from '@/i18n';
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
    expect(Object.keys(resources.ko.plans).sort()).toEqual(
      Object.keys(resources.en.plans).sort(),
    );
    expect(Object.keys(resources.ko.routineDay).sort()).toEqual(
      Object.keys(resources.en.routineDay).sort(),
    );
    expect(Object.keys(resources.ko.settings).sort()).toEqual(
      Object.keys(resources.en.settings).sort(),
    );
    expect(Object.keys(resources.ko.profile).sort()).toEqual(
      Object.keys(resources.en.profile).sort(),
    );
    expect(Object.keys(resources.ko.today).sort()).toEqual(
      Object.keys(resources.en.today).sort(),
    );
  });

  it('loads the routine-day namespace used by initial setup', () => {
    expect(i18n.t('routineDay:dayStartLabel')).toBe('Day start time');
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
