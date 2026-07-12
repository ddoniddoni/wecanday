import {
  filterCountryOptions,
  getCountryOptions,
} from '@/features/onboarding/domain/countries';

describe('country registry', () => {
  it('provides a global ISO country list localized in Korean and English', () => {
    const koreanCountries = getCountryOptions('ko');
    const englishCountries = getCountryOptions('en');

    expect(koreanCountries.length).toBeGreaterThanOrEqual(240);
    expect(koreanCountries).toContainEqual({ code: 'KR', name: '대한민국' });
    expect(koreanCountries).toContainEqual({ code: 'US', name: '미국' });
    expect(englishCountries).toContainEqual({
      code: 'KR',
      name: 'South Korea',
    });
  });

  it('searches by localized name or exact country code characters', () => {
    const countries = getCountryOptions('ko');

    expect(filterCountryOptions(countries, '대한', 'ko')).toContainEqual({
      code: 'KR',
      name: '대한민국',
    });
    expect(filterCountryOptions(countries, 'US', 'ko')).toContainEqual({
      code: 'US',
      name: '미국',
    });
  });
});
