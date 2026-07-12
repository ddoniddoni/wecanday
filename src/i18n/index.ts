import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from '@/i18n/resources';
import { resolveSupportedLocale } from '@/i18n/types';

const deviceLanguageCode = getLocales()[0]?.languageCode;
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  defaultNS: 'common',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
  lng: resolveSupportedLocale(deviceLanguageCode),
  ns: ['auth', 'common', 'onboarding', 'plans', 'routineDay', 'today'],
  parseMissingKeyHandler: () => resources.en.common.safeFallback,
  resources,
  returnEmptyString: false,
  returnNull: false,
  supportedLngs: ['en', 'ko'],
});

export { i18n };
