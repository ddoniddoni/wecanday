import enAuth from '@/i18n/locales/en/auth.json';
import enCommon from '@/i18n/locales/en/common.json';
import enOnboarding from '@/i18n/locales/en/onboarding.json';
import enPlans from '@/i18n/locales/en/plans.json';
import enRoutineDay from '@/i18n/locales/en/routineDay.json';
import enToday from '@/i18n/locales/en/today.json';
import koAuth from '@/i18n/locales/ko/auth.json';
import koCommon from '@/i18n/locales/ko/common.json';
import koOnboarding from '@/i18n/locales/ko/onboarding.json';
import koPlans from '@/i18n/locales/ko/plans.json';
import koRoutineDay from '@/i18n/locales/ko/routineDay.json';
import koToday from '@/i18n/locales/ko/today.json';

export const resources = {
  en: {
    auth: enAuth,
    common: enCommon,
    onboarding: enOnboarding,
    plans: enPlans,
    routineDay: enRoutineDay,
    today: enToday,
  },
  ko: {
    auth: koAuth,
    common: koCommon,
    onboarding: koOnboarding,
    plans: koPlans,
    routineDay: koRoutineDay,
    today: koToday,
  },
} as const;
