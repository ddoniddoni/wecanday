export type ProfileRow = {
  avatar_seed: string;
  country_code: string | null;
  created_at: string;
  display_name: string;
  id: string;
  locale: string | null;
  public_code: string;
  theme_id: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: never;
        Update: Partial<
          Pick<
            ProfileRow,
            | 'avatar_seed'
            | 'country_code'
            | 'display_name'
            | 'locale'
            | 'theme_id'
          >
        >;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
