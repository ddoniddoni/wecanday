import { parseSupabaseConfig } from '@/lib/supabase/config';

describe('Supabase public configuration', () => {
  it('accepts a project URL and publishable key', () => {
    expect(
      parseSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_example',
    });
  });

  it('returns null instead of constructing a broken client', () => {
    expect(parseSupabaseConfig({})).toBeNull();
    expect(
      parseSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'not-a-url',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'key',
      }),
    ).toBeNull();
  });
});
