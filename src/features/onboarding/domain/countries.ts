import * as isoCountries from 'i18n-iso-countries/index';
import enCountries from 'i18n-iso-countries/langs/en.json';
import koCountries from 'i18n-iso-countries/langs/ko.json';

import type { SupportedLocale } from '@/i18n/types';

isoCountries.registerLocale(enCountries);
isoCountries.registerLocale(koCountries);

const countryCodes = new Set(Object.keys(isoCountries.getAlpha2Codes()));

export type CountryOption = {
  code: string;
  name: string;
};

export function isCountryCode(value: string): boolean {
  return countryCodes.has(value);
}

export function getCountryOptions(locale: SupportedLocale): CountryOption[] {
  return Object.entries(
    isoCountries.getNames(locale, { select: 'official' }),
  )
    .map(([code, name]) => ({ code, name }))
    .sort((first, second) =>
      first.name.localeCompare(second.name, locale, { sensitivity: 'base' }),
    );
}

export function filterCountryOptions(
  options: CountryOption[],
  query: string,
  locale: SupportedLocale,
): CountryOption[] {
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);

  if (!normalizedQuery) {
    return options;
  }

  return options.filter(({ code, name }) => {
    return (
      code.toLocaleLowerCase(locale).includes(normalizedQuery) ||
      name.toLocaleLowerCase(locale).includes(normalizedQuery)
    );
  });
}
