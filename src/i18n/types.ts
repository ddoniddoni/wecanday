export const supportedLocales = ['en', 'ko'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export function resolveSupportedLocale(
  languageCode: string | null | undefined,
): SupportedLocale {
  const normalizedLanguageCode = languageCode?.split('-')[0]?.toLowerCase();

  return supportedLocales.find((locale) => locale === normalizedLanguageCode) ?? 'en';
}
