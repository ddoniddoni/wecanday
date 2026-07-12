import 'react-native-url-polyfill/auto';

import {
  createClient,
  processLock,
  type SupabaseClient,
} from '@supabase/supabase-js';

import { authStorage } from '@/lib/supabase/authStorage';
import { parseSupabaseConfig } from '@/lib/supabase/config';
import type { Database } from '@/lib/supabase/database.types';

const config = parseSupabaseConfig({
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
});

export const supabaseClient: SupabaseClient<Database> | null = config
  ? createClient<Database>(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        lock: processLock,
        persistSession: true,
        storage: authStorage,
      },
    })
  : null;
