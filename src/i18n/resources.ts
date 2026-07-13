import enAuth from '@/i18n/locales/en/auth.json';
import enChallenges from '@/i18n/locales/en/challenges.json';
import enCommon from '@/i18n/locales/en/common.json';
import enFriends from '@/i18n/locales/en/friends.json';
import enOnboarding from '@/i18n/locales/en/onboarding.json';
import enNotifications from '@/i18n/locales/en/notifications.json';
import enPlans from '@/i18n/locales/en/plans.json';
import enRoutineDay from '@/i18n/locales/en/routineDay.json';
import enSettings from '@/i18n/locales/en/settings.json';
import enStatistics from '@/i18n/locales/en/statistics.json';
import enToday from '@/i18n/locales/en/today.json';
import koAuth from '@/i18n/locales/ko/auth.json';
import koChallenges from '@/i18n/locales/ko/challenges.json';
import koCommon from '@/i18n/locales/ko/common.json';
import koFriends from '@/i18n/locales/ko/friends.json';
import koOnboarding from '@/i18n/locales/ko/onboarding.json';
import koNotifications from '@/i18n/locales/ko/notifications.json';
import koPlans from '@/i18n/locales/ko/plans.json';
import koRoutineDay from '@/i18n/locales/ko/routineDay.json';
import koSettings from '@/i18n/locales/ko/settings.json';
import koStatistics from '@/i18n/locales/ko/statistics.json';
import koToday from '@/i18n/locales/ko/today.json';

export const resources = {
  en: {
    auth: enAuth,
    challenges: enChallenges,
    common: enCommon,
    friends: enFriends,
    onboarding: enOnboarding,
    notifications: enNotifications,
    plans: enPlans,
    routineDay: enRoutineDay,
    settings: enSettings,
    statistics: enStatistics,
    today: enToday,
  },
  ko: {
    auth: koAuth,
    challenges: koChallenges,
    common: koCommon,
    friends: koFriends,
    onboarding: koOnboarding,
    notifications: koNotifications,
    plans: koPlans,
    routineDay: koRoutineDay,
    settings: koSettings,
    statistics: koStatistics,
    today: koToday,
  },
} as const;
