export type ProfileRow = {
  avatar_seed: string;
  country_code: string | null;
  created_at: string;
  day_start_minute: number | null;
  display_name: string;
  id: string;
  locale: string | null;
  public_code: string;
  routine_day_settings_completed_at: string | null;
  theme_id: string;
  time_zone: string | null;
  updated_at: string;
};

export type PlanRow = {
  created_at: string;
  description: string | null;
  ends_on: string | null;
  id: string;
  starts_on: string;
  status: 'active' | 'archived' | 'completed' | 'draft' | 'paused';
  title: string;
  updated_at: string;
  user_id: string;
  visibility: 'friends_progress' | 'private';
};

export type RoutineItemRow = {
  created_at: string;
  ends_on: string | null;
  id: string;
  plan_id: string;
  reminder_minute: number | null;
  schedule_weekdays: number[];
  sort_order: number;
  starts_on: string;
  status: 'active' | 'archived' | 'completed' | 'paused';
  title: string;
  updated_at: string;
  user_id: string;
};

export type CheckInRow = {
  completed_at: string;
  created_at: string;
  id: string;
  idempotency_key: string;
  received_at: string;
  routine_day: string;
  routine_item_id: string;
  source: 'offline_sync' | 'online';
  user_id: string;
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
      plans: {
        Row: PlanRow;
        Insert: Omit<PlanRow, 'created_at' | 'id' | 'updated_at'>;
        Update: Partial<
          Pick<
            PlanRow,
            'description' | 'ends_on' | 'starts_on' | 'status' | 'title' | 'visibility'
          >
        >;
        Relationships: [];
      };
      routine_items: {
        Row: RoutineItemRow;
        Insert: Omit<RoutineItemRow, 'created_at' | 'id' | 'updated_at'>;
        Update: Partial<
          Pick<
            RoutineItemRow,
            | 'ends_on'
            | 'plan_id'
            | 'reminder_minute'
            | 'schedule_weekdays'
            | 'sort_order'
            | 'starts_on'
            | 'status'
            | 'title'
          >
        >;
        Relationships: [];
      };
      check_ins: {
        Row: CheckInRow;
        Insert: Omit<CheckInRow, 'created_at' | 'id' | 'received_at'>;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      complete_initial_routine_day_settings: {
        Args: {
          p_day_start_minute: number;
          p_time_zone: string;
        };
        Returns: ProfileRow;
      };
      create_plan_with_routine: {
        Args: {
          p_plan_title: string;
          p_routine_title: string;
          p_schedule_weekdays: number[];
          p_starts_on: string;
        };
        Returns: RoutineItemRow;
      };
      complete_check_in: {
        Args: {
          p_completed_at: string;
          p_idempotency_key: string;
          p_routine_day: string;
          p_routine_item_id: string;
          p_source: 'offline_sync' | 'online';
        };
        Returns: CheckInRow;
      };
      undo_check_in: {
        Args: {
          p_idempotency_key: string;
          p_occurred_at: string;
          p_routine_day: string;
          p_routine_item_id: string;
          p_source: 'offline_sync' | 'online';
        };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
