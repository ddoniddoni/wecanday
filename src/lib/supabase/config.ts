import { z } from 'zod';

const supabaseConfigSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(1),
});

export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>;

type PublicEnvironment = {
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
};

export function parseSupabaseConfig(
  environment: PublicEnvironment,
): SupabaseConfig | null {
  const result = supabaseConfigSchema.safeParse({
    url: environment.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return result.success ? result.data : null;
}
