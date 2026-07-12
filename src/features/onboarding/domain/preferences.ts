import { z } from 'zod';

import { isCountryCode } from '@/features/onboarding/domain/countries';
import { supportedLocales } from '@/i18n/types';

export const onboardingPreferencesSchema = z.object({
  version: z.literal(1),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .refine(isCountryCode)
    .nullable(),
  locale: z.enum(supportedLocales).nullable(),
  isComplete: z.boolean(),
});

export type OnboardingPreferences = z.infer<
  typeof onboardingPreferencesSchema
>;

export const defaultOnboardingPreferences: OnboardingPreferences = {
  version: 1,
  countryCode: null,
  locale: null,
  isComplete: false,
};
