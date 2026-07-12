import enCommon from '@/i18n/locales/en/common.json';
import enOnboarding from '@/i18n/locales/en/onboarding.json';
import koCommon from '@/i18n/locales/ko/common.json';
import koOnboarding from '@/i18n/locales/ko/onboarding.json';

export const resources = {
  en: {
    common: enCommon,
    onboarding: enOnboarding,
  },
  ko: {
    common: koCommon,
    onboarding: koOnboarding,
  },
} as const;
