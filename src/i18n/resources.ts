import enAuth from '@/i18n/locales/en/auth.json';
import enCommon from '@/i18n/locales/en/common.json';
import enOnboarding from '@/i18n/locales/en/onboarding.json';
import koAuth from '@/i18n/locales/ko/auth.json';
import koCommon from '@/i18n/locales/ko/common.json';
import koOnboarding from '@/i18n/locales/ko/onboarding.json';

export const resources = {
  en: {
    auth: enAuth,
    common: enCommon,
    onboarding: enOnboarding,
  },
  ko: {
    auth: koAuth,
    common: koCommon,
    onboarding: koOnboarding,
  },
} as const;
