import type { SupabaseClient } from '@supabase/supabase-js';

import { AuthDomainError } from '@/features/auth/domain/authErrors';
import { updateOwnDisplayName } from '@/features/auth/services/profileService';
import type { Database, ProfileRow } from '@/lib/supabase/database.types';

const profile: ProfileRow = {
  avatar_seed: 'seed',
  companion_id: 'sprout',
  country_code: 'KR',
  created_at: '2026-07-14T00:00:00.000Z',
  day_start_minute: 0,
  display_name: 'Sky',
  haptics_enabled: true,
  id: 'user-1',
  locale: 'en',
  public_code: 'Ab7kL2xP9Qm4',
  routine_day_settings_completed_at: '2026-07-14T00:00:00.000Z',
  theme_id: 'light',
  time_zone: 'Asia/Seoul',
  updated_at: '2026-07-14T00:00:00.000Z',
};

describe('updateOwnDisplayName', () => {
  it('trims the name and returns the updated own profile', async () => {
    const single = jest.fn().mockResolvedValue({ data: profile, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ update }));
    const client = { from } as unknown as SupabaseClient<Database>;

    await expect(updateOwnDisplayName(client, 'user-1', '  Sky  ')).resolves.toEqual(profile);

    expect(from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith({ display_name: 'Sky' });
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(select).toHaveBeenCalledWith('*');
  });

  it('rejects an empty nickname before querying Supabase', async () => {
    const from = jest.fn();
    const client = { from } as unknown as SupabaseClient<Database>;

    await expect(updateOwnDisplayName(client, 'user-1', '   ')).rejects.toEqual(
      new AuthDomainError('INVALID_DISPLAY_NAME'),
    );
    expect(from).not.toHaveBeenCalled();
  });
});
